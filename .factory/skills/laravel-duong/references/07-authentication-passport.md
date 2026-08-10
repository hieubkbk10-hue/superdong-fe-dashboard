# 7) Authentication / Laravel Passport theo style sư phụ Dương

Reference này ghi lại các pattern tốt đã quan sát trong Authentication, User và SocialAuth của repo. Kiến thức Passport/Apiato 11.x tổng quát thuộc skill `apiato`, đặc biệt reference `authentication-passport.md`.

## 7.1. Phạm vi tư duy

Trước khi sửa Authentication, tách rõ:

| Concern           | Câu hỏi                                           |
| ----------------- | ------------------------------------------------- |
| Authentication    | Ai đang gọi hệ thống?                             |
| OAuth client      | Ứng dụng web/mobile/server nào đang xin token?    |
| Authorization     | User/client có quyền gọi endpoint không?          |
| Domain permission | User có quyền trên resource cụ thể không?         |
| Session lifecycle | Token nào được cấp, refresh, revoke hoặc hết hạn? |

Tư duy Dương không bắt đầu từ “viết endpoint login”, mà bắt đầu từ contract:

1. Ai sở hữu credential?
2. Client nào đang gọi?
3. User được phép login trong trạng thái nào?
4. Token tồn tại bao lâu?
5. Logout là current device hay all devices?
6. Response nào frontend được phép thấy?
7. Side effect và rollback nằm ở đâu?

## 7.2. Repo map

Các vùng chính:

```text
app/Containers/AppSection/Authentication
    Actions
    Classes
    Configs
    Exceptions
    Middlewares
    Notifications
    Providers
    Tasks
    Traits
    UI/API
    UI/WEB

app/Containers/AppSection/User
    Models/User.php
    Tasks
    UI/API/Transformers

app/Containers/AppSection/SocialAuth
    Abstracts
    Actions
    Configs
    Contracts
    SocialAuthProviders
    Tasks
    UI/API

app/Ship
    Kernels/HttpKernel.php
    Parents/Models/UserModel.php
```

Flow chính:

```text
Route
    -> Request
    -> Controller
    -> Action
    -> Task / SubAction
    -> Passport / Repository / Model
    -> Transformer hoặc response helper
```

## 7.3. Thin Controller, explicit Action result

Controller không tự xây OAuth payload và không xử lý credential:

```php
public function loginProxyForWebClient(
    LoginProxyPasswordGrantRequest $request,
): JsonResponse {
    $result = app(ApiLoginProxyForWebClientAction::class)->run($request);

    return $this->json($result['response_content'])
        ->withCookie($result['refresh_cookie']);
}
```

Pattern:

- Controller nhận typed Request.
- Action trả explicit result gồm response content và cookie.
- Controller chỉ chuyển result thành HTTP response.
- Không đưa Passport client secret hoặc user lookup vào Controller.

Evidence:

- `Authentication/UI/API/Controllers/LoginProxyForWebClientController.php`
- `Authentication/UI/API/Controllers/RefreshProxyForWebClientController.php`
- `Authentication/UI/API/Controllers/ForgotPasswordController.php`

## 7.4. Proxy login giữ client secret ở server

Web frontend không được sở hữu Passport client secret. Action tự lấy client credentials từ config:

```php
$data['client_id'] = config('appSection-authentication.clients.web.id');
$data['client_secret'] = config('appSection-authentication.clients.web.secret');
$data['grant_type'] = 'password';
$data['scope'] = '';
```

Flow:

```text
Frontend credentials
    -> Request validation
    -> Action sanitize input
    -> backend enrich client_id/client_secret/grant_type/scope
    -> CallOAuthServerTask
    -> Passport token response
```

Tư duy:

- User-owned input và server-owned input phải được tách rõ.
- Client không được truyền `client_id`, `client_secret`, `grant_type` hoặc scope tùy ý cho proxy.
- Action là nơi enrich dữ liệu theo use case.
- OAuth call được đóng gói trong một Task riêng.

Evidence:

- `Authentication/Actions/ApiLoginProxyForWebClientAction.php`
- `Authentication/Actions/ApiRefreshProxyForWebClientAction.php`
- `Authentication/Tasks/CallOAuthServerTask.php`
- `Authentication/Configs/appSection-authentication.php`

## 7.5. Login attributes dùng một nguồn cấu hình

Repo hỗ trợ email và phone qua config:

```php
'attributes' => [
    'email' => ['email'],
    'phone' => ['string', 'max:20', 'regex:/^0[0-9]{9,}$/'],
],
```

`LoginCustomAttribute` dùng cùng config để:

1. Xây validation rules.
2. Chọn login field có dữ liệu.
3. Tôn trọng thứ tự ưu tiên.
4. Chuẩn hóa case sensitivity.

`AuthenticationTrait::findForPassport()` dùng cùng allowlist để Passport tìm User.

Pattern:

```text
Config
    -> Request validation
    -> login attribute extraction
    -> Passport user lookup
```

Tư duy:

- Một source of truth cho input contract và lookup.
- Thêm login field mới bằng config và domain schema, không rải `if email/phone` khắp code.
- Thứ tự field trong config là business decision.
- Case sensitivity là explicit configuration.

Evidence:

- `Authentication/Configs/appSection-authentication.php`
- `Authentication/Classes/LoginCustomAttribute.php`
- `Authentication/UI/API/Requests/LoginProxyPasswordGrantRequest.php`
- `Authentication/Traits/AuthenticationTrait.php`

## 7.6. User eligibility được kiểm tra tại authentication boundary

`findForPassport()` không chỉ tìm User mà còn kiểm tra `status`:

```php
if ($user->status != 'enable') {
    return null;
}
```

`IsActive` được gắn trong cả middleware group `web` và `api`.

Pattern defense in depth:

```text
Login boundary
    -> disabled user không được cấp token

Request boundary
    -> user bị disable không tiếp tục dùng API/web session
```

Tư duy:

- Eligibility không chỉ là password đúng.
- Trạng thái User là source of truth.
- Chặn tại lúc issue token và khi dùng session/token.
- Business state `enable/disable` phải nhất quán giữa API và web.

Evidence:

- `Authentication/Traits/AuthenticationTrait.php`
- `Authentication/Middlewares/IsActive.php`
- `app/Ship/Kernels/HttpKernel.php`

## 7.7. OAuth server call là một Task riêng

`CallOAuthServerTask`:

1. Resolve named route `passport.token`.
2. Tạo internal POST Request.
3. Gắn `Accept` và language header.
4. Dispatch qua application kernel.
5. Decode JSON.
6. Chuẩn hóa OAuth failure thành `LoginFailedException`.

```php
$authFullApiUrl = route('passport.token');
$request = Request::create($authFullApiUrl, 'POST', $data, server: $headers);
$response = App::handle($request);
```

Pattern:

- Named route hơn hardcoded URI.
- OAuth transport nằm trong Task, không lặp ở login và refresh Actions.
- Error từ dependency được map sang exception của application.
- Locale được truyền xuyên suốt sang OAuth response.

Tư duy:

- Một integration boundary có adapter riêng.
- Upstream error không được leak nguyên xi ra mọi Controller.
- Login và refresh dùng cùng một OAuth gateway.

Evidence:

- `Authentication/Tasks/CallOAuthServerTask.php`
- `Authentication/Exceptions/LoginFailedException.php`

## 7.8. Refresh token cookie là capability riêng

`MakeRefreshCookieTask` tách cookie construction khỏi Action và Controller:

```php
return cookie(
    'refreshToken',
    $refreshToken,
    config('apiato.api.refresh-expires-in'),
    null,
    null,
    config('session.secure'),
    true,
);
```

Pattern:

- Token issue/refresh và cookie construction là hai trách nhiệm riêng.
- Cookie expiration và `secure` flag lấy từ config.
- `HttpOnly` được đặt explicit.
- Action trả cookie như một phần result; Controller gắn cookie vào response.

Tư duy:

- Security boundary phải nhìn thấy được trong code.
- Cookie không được tạo rải rác ở nhiều Controller.
- Nếu có nhiều client, cookie/token transport policy có thể thay đổi mà không sửa OAuth Task.

Evidence:

- `Authentication/Tasks/MakeRefreshCookieTask.php`
- `Authentication/Actions/ApiLoginProxyForWebClientAction.php`
- `Authentication/Actions/ApiRefreshProxyForWebClientAction.php`

## 7.9. Logout phân biệt current token và all devices

Current token logout:

```text
Bearer token
    -> parse token identifier
    -> revoke access token
    -> revoke refresh tokens linked to access token
```

Repo dùng:

- `TokenRepository::revokeAccessToken()`
- `RefreshTokenRepository::revokeRefreshTokensByAccessTokenId()`

All-device logout:

```php
public static function logoutAuthByIdAllDevices($userId)
{
    $user = static::find($userId);
    $refreshTokenRepository = app(RefreshTokenRepository::class);

    foreach ($user->tokens as $token) {
        $token->revoke();
        $refreshTokenRepository->revokeRefreshTokensByAccessTokenId($token->id);
    }
}
```

Tư duy:

- Đặt tên method theo phạm vi revoke.
- Logout current device và logout all devices là hai use case khác nhau.
- Revoke access token phải đi cùng quyết định về refresh token liên quan.
- Admin disable hoặc admin đổi password của user khác hiện kích hoạt all-device revoke.

Evidence:

- `Authentication/Actions/ApiLogoutAction.php`
- `User/Models/User.php::logoutAuthByIdAllDevices()`
- `User/Tasks/UpdateUserTask.php`

## 7.10. Forgot password không tiết lộ user tồn tại

Action luôn để Controller trả cùng public response:

```php
try {
    $user = app(FindUserByEmailTask::class)->run($sanitizedData['email']);
} catch (Exception) {
    return false;
}
```

Controller:

```php
app(ForgotPasswordAction::class)->run($request);

return $this->noContent();
```

Pattern:

- Internal result có thể khác nhau.
- Public HTTP contract không xác nhận email có tồn tại.
- Controller không branch response theo lookup result.
- Mail và reset-token orchestration nằm trong Action.

Tư duy:

- Security UX được thiết kế từ response contract.
- Không phải mọi domain outcome đều được trả cho client.
- Enumeration resistance quan trọng hơn thông báo “chính xác” cho attacker.

Evidence:

- `Authentication/Actions/ForgotPasswordAction.php`
- `Authentication/UI/API/Controllers/ForgotPasswordController.php`

## 7.11. Callback URL dùng allowlist

Forgot password và email verification không nhận arbitrary callback URL.

```php
'reseturl' => [
    'required',
    Rule::in(config('appSection-authentication.allowed-reset-password-urls')),
],
```

Pattern:

- URL frontend hợp lệ nằm trong config.
- Request dùng `Rule::in()` thay manual string comparison.
- Backend quyết định redirect destinations được tin cậy.

Tư duy:

- URL cũng là input cần authorize, không chỉ validate syntax.
- Config allowlist giúp deployment quyết định domain hợp lệ.
- Không nối arbitrary user URL vào email security flow.

Evidence:

- `Authentication/UI/API/Requests/ForgotPasswordRequest.php`
- `Authentication/UI/API/Requests/SendVerificationEmailRequest.php`
- `Authentication/Configs/appSection-authentication.php`

## 7.12. Email verification dùng signed URL, Hash ID và idempotency

Verification flow:

```text
Signed route
    -> Request decode URL id
    -> FindUserByIdTask
    -> constant-time email hash check
    -> mark verified nếu chưa verified
    -> notify
```

Pattern:

- Route dùng signed middleware.
- `$decode` và `$urlParameters` chứa `id`.
- Action dùng `hash_equals()`.
- `hasVerifiedEmail()` làm operation idempotent.
- User lookup tái sử dụng Task.

Tư duy:

- Không tin URL chỉ vì có ID.
- Signature, identity và email hash là các lớp kiểm tra khác nhau.
- Repeated request không lặp state transition.

Evidence:

- `Authentication/UI/API/Routes/VerifyEmail.v1.private.php`
- `Authentication/UI/API/Requests/VerifyEmailRequest.php`
- `Authentication/Actions/VerifyEmailAction.php`

## 7.13. Password policy đặt trên User source of truth

Repo đặt password policy trong model:

```php
public static function getPasswordValidationRules(): Password
{
    return Password::min(5)
        ->letters()
        ->mixedCase()
        ->numbers()
        ->symbols();
}
```

Pattern:

- Register, update password và reset password dùng cùng object rule.
- Không duplicate chuỗi validation ở từng Request.
- `Password` rule object dễ mở rộng và đọc hơn magic string.
- Pattern cần học là source of truth và khả năng tái sử dụng object rule; các tham số cụ thể phải được đánh giá theo security requirement của dự án.

Tư duy:

- Rule thuộc invariant của User nên có một nguồn.
- Đổi password policy phải thay đổi đồng bộ toàn bộ entry points.

Evidence:

- `User/Models/User.php::getPasswordValidationRules()`
- Authentication/User Requests sử dụng method này.

## 7.14. Social authentication dùng strategy pattern

Flow:

```text
Route
    -> Request
    -> Controller
    -> SocialLoginAction
    -> GetSocialAuthProviderInstanceSubAction
    -> SocialAuthProvider contract
    -> concrete provider
    -> Find/Create/Update Tasks
    -> ApiLoginFromUserTask
    -> UserTransformer
```

Provider design:

```text
Contract
    -> Abstract Socialite implementation
    -> Google/Facebook implementation
    -> Twitter override khi protocol khác
```

Patterns:

- Explicit config map: provider name đến provider class.
- SubAction chọn strategy từ allowlist.
- Unsupported provider có domain exception.
- Action điều phối full social login use case.
- Task xử lý lookup, create/update và token issuance.
- Tái sử dụng `CreateUserByCredentialsTask` từ Authentication.
- Provider adapter dùng stateless authentication.
- Dữ liệu ngoài như avatar URL được kiểm tra trước khi persist.
- Social token/profile secrets không đi qua UserTransformer.

Tư duy:

- Extension point bằng contract/class map, không dùng chuỗi `if/elseif` ở Controller.
- Reuse invariant tạo User, hashing và transaction từ Authentication.
- Provider khác biệt chỉ override phần khác biệt.
- Token issuance là capability riêng.

Evidence:

- `SocialAuth/Contracts/SocialAuthProvider.php`
- `SocialAuth/Abstracts/SocialAuthProvider.php`
- `SocialAuth/Actions/GetSocialAuthProviderInstanceSubAction.php`
- `SocialAuth/Actions/SocialLoginAction.php`
- `SocialAuth/Tasks/ApiLoginFromUserTask.php`
- `SocialAuth/Configs/appSection-socialAuth.php`

## 7.15. Layer decision table

| Logic                                  | Layer                                            |
| -------------------------------------- | ------------------------------------------------ |
| Validation login/password/callback URL | Request                                          |
| Chọn configured login attribute        | `LoginCustomAttribute`                           |
| OAuth payload enrichment               | Action                                           |
| Gọi Passport token endpoint            | Task                                             |
| Tạo refresh cookie                     | Task                                             |
| Revoke current token                   | Action hoặc dedicated Task theo pattern gần nhất |
| Revoke all-device tokens               | Domain method/Task có tên explicit               |
| Chọn social provider                   | SubAction                                        |
| Provider-specific OAuth call           | Provider adapter                                 |
| Find/create/update social User         | Tasks                                            |
| Public User response                   | Transformer                                      |
| User active state                      | Model/source of truth và auth middleware         |
| Generate & verify OTP                  | Actions & Tasks                                  |

## 7.16. OTP Generation & Verification Patterns

Flow:

```text
CreateOtpAction -> CreateOtpTask -> OtpRepository (updateOrCreate / resend throttle) -> Send OTP Notification
VerifyOtpAction -> VerifyOtpTask -> OtpRepository (verify code + expiry) -> Mark approved (single-use) -> Auto markEmailAsVerified
```

Patterns:

- **Resend Throttle (Chống Spam)**: Kiểm tra thời gian giãn cách giữa các lần resend (`diffInSeconds($otp->updated_at) > 60`), tránh spam SMS/Email.
- **Reuse Unapproved Record**: Sử dụng `updateOrCreate` cập nhật bản ghi chưa `approve` thay vì spam tạo nhiều dòng rác trong DB.
- **Single-Use Token (Chống Replay)**: Cập nhật `approve = true` ngay khi xác minh thành công để ngăn chặn việc dùng lại 1 mã OTP nhiều lần.
- **Auto-verify Identity**: Tự động kích hoạt `$user->markEmailAsVerified()` khi xác minh thành công với luồng verify account.
- **Transaction Safety**: Bọc `CreateOtpTask` trong DB transaction để rollback khi gửi mail/tạo OTP bị sự cố.

## 7.17. Tư duy senior khi thiết kế Authentication

### Observation

Authentication là security boundary và lifecycle, không chỉ là một form login.

### Inference

Nếu chỉ nhìn endpoint riêng lẻ, dễ bỏ sót client identity, refresh, revoke, user state, callback URL và response leakage.

### Decision

Trước khi code, luôn viết contract:

```text
Actor
Client
Credential source
Eligible user states
Grant/token type
Token lifetime
Refresh transport
Revocation scope
Public response
Error disclosure
Rate limit
Tests
```

Các nguyên tắc:

- Server-owned fields không nhận từ client.
- Security-sensitive response phải tối thiểu.
- Một source of truth cho login attributes và password policy.
- Current-device và all-device semantics phải có tên khác nhau.
- External providers đứng sau contract.
- Integration errors được map thành application exceptions.
- Repeated security action nên idempotent khi phù hợp.
- Không log password, client secret, reset token, access token hoặc refresh token.

## 7.17. Testing matrix

| Flow               | Cases                                                                           |
| ------------------ | ------------------------------------------------------------------------------- |
| Login              | email, phone, case normalization, invalid credentials, disabled user            |
| Proxy              | client credentials đến từ config, OAuth failure mapping                         |
| Refresh            | body token, cookie token, invalid token, stable cookie response                 |
| Logout current     | access token và linked refresh token bị revoke                                  |
| Logout all devices | tất cả access/refresh tokens của User bị revoke                                 |
| Forgot password    | email tồn tại và không tồn tại trả cùng public status                           |
| Callback URL       | allowlisted được chấp nhận, URL khác bị reject                                  |
| Verification       | valid signed link, invalid hash/signature, repeated verification                |
| Password policy    | register/update/reset dùng cùng User rule                                       |
| Social auth        | supported provider, unsupported provider, existing/new User, public Transformer |
| Middleware         | disabled User bị chặn trên API và web                                           |

## 7.18. Common mistakes

| Mistake                                     | Style Dương                                |
| ------------------------------------------- | ------------------------------------------ |
| Hardcode email login ở nhiều nơi            | Config-driven login attributes             |
| Cho frontend gửi Passport client secret     | Backend proxy enriches server-owned fields |
| Gọi `/oauth/token` lặp trong nhiều Actions  | Một OAuth Task dùng chung                  |
| Controller tự revoke token                  | Thin Controller, use case ở Action/Task    |
| Logout method tên mơ hồ                     | Tên thể hiện current/all-device scope      |
| Trả khác nhau khi email reset không tồn tại | Một public no-content contract             |
| Nhận arbitrary callback URL                 | `Rule::in()` với config allowlist          |
| `if provider === ...` trong Controller      | Contract + class map + SubAction           |
| Duplicate password rules                    | User model source of truth                 |
| Trả raw User/token internals                | Transformer và explicit token response     |

## 7.19. Checklist

- [ ] Đã phân biệt authentication, authorization và domain permission.
- [ ] Đã trace full flow từ Route tới Passport/Model.
- [ ] User-owned và server-owned input được tách.
- [ ] Client secret chỉ tồn tại server-side.
- [ ] Login attributes và password policy có một source of truth.
- [ ] User eligibility được kiểm tra ở authentication boundary.
- [ ] OAuth transport nằm sau Task/adapter.
- [ ] Current-device/all-device revocation được đặt tên rõ.
- [ ] Callback URL dùng allowlist.
- [ ] Public errors không hỗ trợ user enumeration.
- [ ] Verification có signature, identity check và idempotency.
- [ ] Social providers đứng sau contract và explicit class map.
- [ ] Response không leak credential hoặc internal token metadata.
- [ ] Tests bao phủ issue, refresh, revoke và disabled-user lifecycle.
