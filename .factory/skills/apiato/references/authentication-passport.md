# Apiato 11.x Authentication và Laravel Passport

Reference này ghi lại cơ chế Authentication chuẩn của Apiato 11.x dựa trên Laravel Passport. Nội dung repo-specific và phong cách triển khai của dự án phải đặt trong skill `laravel-duong`.

## 1. Nguồn và phạm vi

Nguồn chính:

- `folk-docs-api-ato/versioned_docs/version-11.x/core-features/authentication.mdx`
- `folk-docs-api-ato/versioned_docs/version-11.x/core-features/authorization.md`
- `folk-docs-api-ato/versioned_docs/version-11.x/core-features/user-registration.md`
- `folk-docs-api-ato/versioned_docs/version-11.x/getting-started/installation.md`
- `folk-docs-api-ato/versioned_docs/version-11.x/getting-started/requirements.md`
- `folk-docs-api-ato/versioned_docs/version-11.x/main-components/requests.md`
- `folk-docs-api-ato/versioned_docs/version-11.x/miscellaneous/tests-helpers.md`
- `folk-docs-api-ato/versioned_docs/version-11.x/optional-components/tests.md`

Trước khi áp dụng ví dụ Passport:

1. Kiểm tra version `laravel/passport` trong `composer.lock`.
2. Kiểm tra Authentication Container và routes hiện có.
3. Chạy `php artisan route:list` để xác nhận URI, method và middleware thực tế.
4. Không sao chép client ID, client secret, access token hoặc refresh token vào code, tài liệu hay log.

## 2. Mental model

```text
OAuth Client
    -> Authentication endpoint hoặc proxy
    -> Passport Authorization Server
    -> Access Token
    -> auth:api
    -> Protected API endpoint
```

Các khái niệm cần tách rõ:

| Khái niệm                   | Ý nghĩa                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| User authentication         | Xác minh danh tính user                                            |
| OAuth client authentication | Xác minh ứng dụng đang yêu cầu token                               |
| Access token                | Credential ngắn hạn dùng gọi API                                   |
| Refresh token               | Credential dùng xin access token mới                               |
| OAuth client                | Ứng dụng tiêu thụ API, có `client_id` và có thể có `client_secret` |
| Scope                       | Giới hạn capability của token                                      |
| API authorization           | Quyết định token/user có được gọi endpoint hay không               |
| Domain permission           | Quyền nghiệp vụ như sửa Work, quản lý Workspace                    |

Authentication chứng minh danh tính. Authorization quyết định quyền truy cập. Không trộn hai bước này.

## 3. Thiết lập Passport

Các lệnh Apiato 11.x thường dùng:

```text
php artisan migrate
php artisan db:seed
php artisan passport:install
php artisan passport:client --password
php artisan passport:client --personal
php artisan route:list
vendor/bin/phpunit
```

`passport:install` tạo encryption keys và các OAuth clients mặc định. Luôn lưu client credentials ở server-side configuration hoặc secret manager.

Các trách nhiệm cấu hình:

- `config/auth.php`: guard và user provider.
- Authentication `AuthServiceProvider`: Passport routes, token expiration, scopes hoặc grant configuration.
- `app/Ship/Configs/apiato.php`: Apiato API prefix, token expiration và các tùy chọn framework.
- Authentication Container config: client mapping, login attributes, callback URL allowlists.

## 4. Guards và middleware

API endpoint:

```php
Route::get('secret/info', [Controller::class, 'getSecretInfo'])
    ->middleware('auth:api');
```

Client gửi:

```http
Authorization: Bearer {access-token}
```

Web endpoint:

```php
Route::get('private/page', [Controller::class, 'showPrivatePage'])
    ->middleware('auth:web');
```

Rules:

- `auth:api` bảo vệ stateless API bằng Passport token.
- `auth:web` bảo vệ session-based web route.
- Tên file `.private.php` không tự thêm authentication. Luôn kiểm tra middleware thật.
- Client Credentials có thể cần middleware/guard riêng theo Passport version. Không giả định token machine-to-machine có authenticated User.

## 5. First-party client và Password Grant

Apiato 11.x docs dùng Resource Owner Password Credentials Grant cho first-party web/mobile clients.

Request trực tiếp tới OAuth server:

```http
POST /v1/oauth/token
Content-Type: application/x-www-form-urlencoded
Accept: application/json
```

Payload:

```text
username
password
client_id
client_secret
grant_type=password
scope
```

Response điển hình:

```json
{
  "token_type": "Bearer",
  "expires_in": 86400,
  "access_token": "...",
  "refresh_token": "..."
}
```

Không giả định password grant luôn được bật ở mọi Passport version. Kiểm tra package version, provider và client type của dự án.

## 6. Proxy login cho first-party client

Browser JavaScript và mobile binary không phải nơi an toàn để giữ client secret. Apiato dùng proxy endpoint để backend tự gắn OAuth client credentials.

```text
Frontend
    -> POST /v1/clients/web/login
    -> Proxy Action
    -> client_id/client_secret từ server config
    -> Passport token endpoint
    -> token response
```

Nguyên tắc:

- Mỗi first-party client có thể có proxy endpoint và client credentials riêng.
- Request từ frontend chỉ chứa user credentials cần thiết.
- Backend sở hữu `client_id`, `client_secret`, `grant_type` và scope.
- Không nhận client secret từ browser rồi chuyển tiếp.
- Không tự ký JWT hoặc tự dựng token response khi Passport đã là authorization server.
- Chuẩn hóa OAuth errors thành API exception contract ổn định.
- Không log request OAuth nguyên khối.

Config shape:

```php
'clients' => [
    'web' => [
        'id' => env('CLIENT_WEB_ID'),
        'secret' => env('CLIENT_WEB_SECRET'),
    ],
],
```

Không ghi giá trị thật của environment variables vào skill, source control hoặc error output.

## 7. Refresh token

Refresh không proxy:

```http
POST /v1/oauth/token
```

```text
grant_type=refresh_token
client_id={client-id}
client_secret={client-secret}
refresh_token={refresh-token}
scope=
```

Proxy refresh:

```text
Frontend
    -> /v1/clients/web/refresh
    -> backend gắn client credentials
    -> Passport token endpoint
    -> access token và refresh token mới
```

Rules:

- Validate sự tồn tại của refresh token.
- Nếu hỗ trợ cookie, cookie nên là `HttpOnly`; dùng `Secure` trên HTTPS và đặt `SameSite` theo kiến trúc frontend/backend.
- Backend quyết định client credentials và grant type.
- Xử lý invalid, expired và revoked refresh token bằng exception contract ổn định.
- Không khẳng định rotation/reuse semantics nếu chưa kiểm tra Passport version và implementation.
- Kiểm thử refresh qua token endpoint thật khi cần xác minh client validation và rotation.

## 8. Client Credentials và Personal Access Token

Hai khái niệm này không được xem là đồng nghĩa:

- **Client Credentials Grant**: machine-to-machine, principal là OAuth client, thường không có User.
- **Personal Access Token**: token được phát hành thay mặt một User cho integration/script của user đó.

Khi dùng Client Credentials:

- Với Passport 10.x như repo này, tạo client bằng:

  ```text
  php artisan passport:client --client
  ```

- Đăng ký middleware alias trỏ tới `Laravel\Passport\Http\Middleware\CheckClientCredentials` cho route machine-to-machine.
- Dùng `CheckClientCredentialsForAnyScope` khi endpoint chấp nhận một trong nhiều scopes thay vì yêu cầu tất cả scopes.
- Định nghĩa scopes tối thiểu.
- `auth:api` dành cho token có User principal; Client Credentials route dùng client-credentials middleware.
- Không gọi code giả định `$request->user()` luôn tồn tại.
- Test secret sai, scope thiếu, token expired và token revoked.
- Dùng `Passport::actingAsClient($client, $scopes)` để test route, middleware và scope.
- Gọi thật `/v1/oauth/token` với `grant_type=client_credentials` để test client ID, secret và grant issuance.

Khi dùng Personal Access Token:

- Token gắn với User.
- Đặt tên token có ý nghĩa.
- Chỉ cấp scopes cần thiết.
- Dùng `Passport::actingAs()` cho unit/functional tests không cần đi qua OAuth token endpoint.

## 9. Logout và revocation

Apiato 11.x docs mô tả logout bằng private endpoint nhận Bearer token:

```http
DELETE /v1/logout
Authorization: Bearer {access-token}
```

Logout flow:

```text
auth:api
    -> lấy current access-token identifier
    -> revoke access token
    -> revoke refresh tokens liên kết nếu contract yêu cầu
    -> xóa refresh cookie nếu proxy dùng cookie
    -> trả response không chứa token
```

Phân biệt:

- Logout current token/device.
- Logout all devices.
- Revoke token sau password reset/change.
- Revoke OAuth client.

Không dùng một behavior thay cho behavior khác mà chưa xác định contract.

## 10. Token expiration

Apiato 11.x đặt token lifetime thông qua Authentication provider và config:

```php
Passport::tokensExpireIn(
    Carbon::now()->addMinutes(config('apiato.api.expires-in'))
);

Passport::refreshTokensExpireIn(
    Carbon::now()->addMinutes(config('apiato.api.refresh-expires-in'))
);
```

Rules:

- Xác nhận config unit là phút hay ngày trong implementation thực tế.
- Access token, refresh token và personal access token có thể có lifetime khác nhau.
- Thay đổi config không làm thay đổi expiration của token đã phát hành.
- Không đặt lifetime production theo ví dụ tài liệu mà không có yêu cầu nghiệp vụ.

## 11. Custom login attributes

Apiato cho phép login bằng email, username, phone hoặc field khác.

Thiết kế nên có:

1. Config allowlist các login attributes.
2. Request validation được xây từ cùng config.
3. Một resolver chọn field có dữ liệu.
4. Chuẩn hóa case nếu business rule cho phép.
5. Passport user lookup dùng cùng allowlist.
6. User eligibility check như active/disabled.

Không hardcode email ở Request nhưng dùng phone ở Passport lookup, hoặc ngược lại.

## 12. Registration

Registration và login là hai use case khác nhau:

- Registration tạo User và trả User resource.
- Login cấp access/refresh token.
- Không tự động cấp token sau registration nếu API contract không yêu cầu.

Flow:

```text
Register Request
    -> Register Action
    -> Create User Task
    -> optional role/verification side effects
    -> User Transformer
```

Password phải được hash tại một nguồn duy nhất. Không nhận role, status hoặc token owner từ public registration payload nếu server phải sở hữu các field đó.

## 13. Email verification

Email verification gồm hai concern:

1. Gửi signed verification URL.
2. Bảo vệ endpoint bằng middleware `verified` nếu business rule yêu cầu.

Patterns:

- Allowlist frontend callback URLs.
- Route verification dùng signed middleware.
- Hash ID được decode trong Request.
- So sánh email hash bằng constant-time comparison.
- Verification phải idempotent.
- Bật tính năng không đồng nghĩa mọi route tự được bảo vệ. Gắn `verified` vào đúng endpoint.

## 14. Password reset

Flow chuẩn:

```text
Forgot Password Request
    -> validate email và allowed callback URL
    -> tạo reset token qua broker
    -> gửi mail
    -> trả generic response

Reset Password Request
    -> validate token/email/password
    -> broker reset
    -> hash password
    -> rotate remember token
    -> optional revoke-session policy
```

Security rules:

- Không tiết lộ email có tồn tại.
- Callback URL phải nằm trong allowlist.
- Password rule phải dùng cùng policy của User/domain.
- Không log token reset.
- Chính sách revoke Passport tokens sau reset phải được xác định rõ.

## 15. Social authentication

Social authentication là adapter bên ngoài Passport login truyền thống:

```text
Provider token
    -> Social provider adapter
    -> find/create/link User
    -> issue application token
```

Giữ provider-specific logic sau contract/adapter. Không để Controller chứa conditional theo từng provider.

## 16. Testing

Apiato:

- Functional Tests kiểm tra Routes/endpoints.
- Unit Tests kiểm tra Actions và Tasks.
- Container TestCase kế thừa Ship TestCase.

Helpers:

```php
protected bool $auth = false;

$this->auth(false)->makeCall($data);
$this->getTestingUser();
$this->injectId($id)->makeCall();
```

Passport helpers:

```php
Passport::actingAs($user, $scopes);
Passport::actingAsClient($client, $scopes);
```

Testing matrix:

| Flow               | Cases                                                                    |
| ------------------ | ------------------------------------------------------------------------ |
| Login              | success, invalid credentials, disabled user, configured login attributes |
| Proxy              | server-owned client credentials, invalid client, stable error response   |
| Refresh            | success, missing, invalid, expired, revoked                              |
| Private route      | missing token, valid token, expired token, revoked token                 |
| Scope              | allowed, missing, wrong scope                                            |
| Client credentials | valid client, invalid secret, no User assumption                         |
| Logout             | current access token revoked, linked refresh behavior                    |
| Registration       | valid, validation failure, duplicate identity                            |
| Forgot password    | existing/non-existing email return same public contract                  |
| Email verification | valid signed URL, invalid signature, idempotent repeat                   |

Use `Passport::actingAs()` for endpoint authorization tests. Call the real OAuth token endpoint for tests whose purpose is client validation, grant behavior, refresh or token response.

## 17. Common mistakes

| Mistake                                             | Correction                                               |
| --------------------------------------------------- | -------------------------------------------------------- |
| Exposing `client_secret` to frontend                | Use backend proxy or a grant designed for public clients |
| Treating Client Credentials as User login           | Keep client principal and user principal separate        |
| Using `Passport::actingAs()` to prove refresh works | Exercise OAuth endpoint for grant/refresh tests          |
| Assuming `.private.php` adds auth                   | Inspect route middleware                                 |
| Mixing authentication and RBAC                      | Authenticate first, authorize separately                 |
| Logging OAuth request/response                      | Redact password, secret and tokens                       |
| Hardcoding login field                              | Use configured allowlist consistently                    |
| Reimplementing JWT issuance                         | Delegate to Passport authorization server                |
| Returning raw OAuth internals everywhere            | Stabilize endpoint response contract                     |
| Guessing token TTL units                            | Read provider/config implementation                      |

## 18. Checklist

- [ ] Passport version and existing Authentication Container inspected.
- [ ] Guard/provider and actual routes confirmed.
- [ ] Correct OAuth client type created.
- [ ] Client credentials remain server-side.
- [ ] Proxy owns grant type, client ID, client secret and scopes.
- [ ] Login attributes share one config source.
- [ ] Disabled/ineligible users cannot receive valid sessions.
- [ ] Access/refresh expiration is explicit.
- [ ] Logout/revocation scope is explicit.
- [ ] Callback URLs are allowlisted.
- [ ] Errors do not leak credentials or user existence.
- [ ] Functional and unit tests cover token lifecycle.
