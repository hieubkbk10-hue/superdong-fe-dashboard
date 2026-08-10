# Quy Chuẩn Đặt Tên Laravel / Apiato

## 1. Nguyên tắc chung

- Tất cả định danh trong code dùng tiếng Anh, rõ nghĩa, đúng nghiệp vụ.
- Class và file PHP chứa class dùng `PascalCase`: `CreateUserAction.php`, `UserRepository.php`.
- Method, function, biến và property dùng `camelCase`: `$userId`, `findUserById()`.
- Constant dùng `UPPER_SNAKE_CASE`: `MAX_LOGIN_ATTEMPTS`.
- Database table, column và request/response field ưu tiên `snake_case`: `users`, `email_verified_at`, `role_id`.
- URI route ưu tiên RESTful lowercase, dùng danh từ số nhiều: `users/{id}`, `roles/{id}/permissions`.
- Không dùng tên mơ hồ như `CommonService`, `HelperTask`, `handleData`, `processInfo` nếu có thể đặt tên cụ thể hơn.

## 2. Namespace và Container

- Container đặt trong `app/Containers/AppSection/{Container}`.
- `{Container}` dùng `PascalCase`, thường là model/nghiệp vụ chính: `User`, `Authentication`, `Authorization`, `Product`.
- Namespace phải khớp thư mục:

```php
namespace App\Containers\AppSection\User\Actions;
```

## 3. Flow chuẩn Apiato / Porto

Luồng mặc định:

```txt
Route -> Controller -> Request -> Action -> Task -> Repository/Model -> Transformer
```

- Controller mỏng, chỉ nhận Request, gọi Action, trả response/Transformer.
- Action điều phối use case.
- Task chứa một bước nhỏ, query/mutation hoặc logic tái sử dụng.
- Repository/Model xử lý data access theo pattern hiện có.
- Transformer định dạng response JSON.

## 4. Action

- Vị trí: `app/Containers/AppSection/{Container}/Actions`.
- Tên: `{Verb}{Resource}Action.php`.
- Class extend `ParentAction`.
- Method chính: `run()`.

Ví dụ:

```txt
CreateAdminAction.php
UpdateUserAction.php
FindUserByIdAction.php
GetAllUsersAction.php
DeleteUserAction.php
SyncUserRolesAction.php
```

## 5. Task

- Vị trí: `app/Containers/AppSection/{Container}/Tasks`.
- Tên: `{Verb}{Resource}Task.php`.
- Class extend `ParentTask`.
- Method chính: `run()`.

Ví dụ:

```txt
FindUserByEmailTask.php
UpdateUserTask.php
CreatePasswordResetTokenTask.php
CallOAuthServerTask.php
```

## 6. Controller

- API Controller: `app/Containers/AppSection/{Container}/UI/API/Controllers`.
- Web Controller: `app/Containers/AppSection/{Container}/UI/WEB/Controllers`.
- Tên: `{ActionName}Controller.php`.
- Method trong repo này ưu tiên `camelCase` theo action hiện có: `updateUser()`, `findUserById()`.
- Không đưa business logic vào Controller.

Ví dụ:

```txt
UpdateUserController.php
FindUserByIdController.php
DeleteUserController.php
```

## 7. Request

- API Request: `app/Containers/AppSection/{Container}/UI/API/Requests`.
- Web Request: `app/Containers/AppSection/{Container}/UI/WEB/Requests`.
- Tên: `{ActionName}Request.php`.
- Class extend `ParentRequest`.
- Method bắt buộc: `rules(): array`, `authorize(): bool`.
- Giữ các property Apiato khi file hiện có sử dụng: `$access`, `$decode`, `$urlParameters`.
- Validation key dùng `snake_case`: `user_id`, `email_verified_at`.

## 8. Transformer

- Vị trí: `app/Containers/AppSection/{Container}/UI/API/Transformers`.
- Tên: `{ModelName}Transformer.php`.
- Class extend `ParentTransformer`.
- Method chính: `transform(Model $model): array`.
- Include relation dùng `include{RelationName}()`: `includeRoles()`, `includePermissions()`, `includeUserAddress()`.
- Response key ưu tiên `snake_case`.

## 9. Model và Relationship

- Vị trí: `app/Containers/AppSection/{Container}/Models`.
- Tên model số ít, `PascalCase`: `User`, `Role`, `OrderItem`.
- Table mặc định dùng `snake_case` số nhiều: `users`, `roles`, `order_items`.
- Relationship method dùng `camelCase`.
- `hasOne` / `belongsTo` đặt số ít: `user()`, `profile()`.
- `hasMany` / `belongsToMany` đặt số nhiều: `roles()`, `orderItems()`.

## 10. Repository

- Vị trí: `app/Containers/AppSection/{Container}/Data/Repositories`.
- Tên: `{ModelName}Repository.php`.
- Class extend `ParentRepository`.
- `$fieldSearchable` dùng tên column database `snake_case`.
- Mỗi model nên có repository tương ứng nếu container đang theo repository pattern.

## 11. Route file

- Vị trí: `app/Containers/AppSection/{Container}/UI/API/Routes`.
- Tên file theo format repo:

```txt
{ActionName}.v{version}.{visibility}.php
```

Ví dụ:

```txt
UpdateUser.v1.private.php
LoginUsingCredentialGrant.v1.public.php
_user.v1.public.php
```

- Private route dùng middleware/auth guard hiện có, ví dụ `auth:api`.
- Nếu route file có block `@api`, khi đổi behavior endpoint phải cập nhật block đó.

## 12. Migration, Factory, Seeder

- Migration đặt tại `Data/Migrations` trong container hoặc `database/migrations`.
- Migration file dùng format Laravel:

```txt
YYYY_MM_DD_HHMMSS_create_users_table.php
YYYY_MM_DD_HHMMSS_add_status_to_orders_table.php
```

- Factory: `{ModelName}Factory.php`.
- Seeder: `{Purpose}Seeder.php`, ví dụ `DefaultRolesSeeder.php`, `UserPermissionsSeeder.php`.
- Table/column luôn dùng `snake_case`.

## 13. Mail, Notification, Job, Event, Listener, Command

- Notification: `{EventOrPurpose}Notification.php`, ví dụ `PasswordUpdatedNotification.php`.
- Mail: `{Purpose}Mail.php`, ví dụ `WelcomeMail.php`.
- Job: `{Verb}{Resource}Job.php`, ví dụ `ProcessPaymentJob.php`.
- Event: `{Subject}{PastTenseVerb}Event.php`, ví dụ `UserRegisteredEvent.php`.
- Listener: `{Verb}{Result}Listener.php`, ví dụ `SendWelcomeEmailListener.php`.
- CLI Command: `{Verb}{Resource}Command.php`, ví dụ `CreateAdminCommand.php`.
- Command signature dùng kebab-case theo namespace: `user:create-admin`, `orders:sync-status`.

## 14. Helper, Service, DTO, Enum, Exception, Policy

- Global helper function dùng `snake_case`: `format_money()`, `current_workspace()`.
- Method trong class/service dùng `camelCase`: `formatMoney()`, `getCurrentWorkspace()`.
- Service: `{Domain}Service.php`, ví dụ `OAuthTokenService.php`.
- DTO/Data object: `{ActionOrPurpose}Data.php`, ví dụ `CreateUserData.php`.
- Enum: `{Domain}Status` hoặc `{Domain}Type`, ví dụ `UserStatus`.
- Exception: `{SpecificProblem}Exception.php`, ví dụ `InvalidCredentialsException.php`.
- Policy: `{ModelName}Policy.php`, method theo Laravel: `viewAny()`, `view()`, `create()`, `update()`, `delete()`.

## 15. Test

- Unit test: `app/Containers/AppSection/{Container}/Tests/Unit`.
- Functional API test: `app/Containers/AppSection/{Container}/UI/API/Tests/Functional`.
- Tên file: `{ClassOrFeatureUnderTest}Test.php`.
- Method test có thể dùng style hiện có trong file. Ưu tiên mô tả rõ:

```php
public function test_user_can_be_created(): void
public function testCreateUser(): void
```

## 16. PSR-12 bắt buộc cho PHP

- PHP keyword/type lowercase: `array`, `bool`, `int`, `string`.
- Method/function dùng `camelCase`.
- Class/interface/trait dùng `PascalCase`.
- Visibility bắt buộc cho property và method.
- Không prefix `_` để biểu thị private/protected.
- Indent PHP: 4 spaces.
- Không đóng `?>` trong file PHP thuần.
- Mỗi file PHP kết thúc bằng một newline.

## 17. Checklist tạo endpoint mới

Ví dụ endpoint cập nhật mật khẩu user:

```txt
UI/API/Routes/UpdateUserPassword.v1.private.php
UI/API/Controllers/UpdateUserPasswordController.php
UI/API/Requests/UpdateUserPasswordRequest.php
Actions/UpdateUserPasswordAction.php
Tasks/UpdateUserPasswordTask.php
UI/API/Transformers/UserTransformer.php
Tests/Unit/UpdateUserPasswordActionTest.php
UI/API/Tests/Functional/UpdateUserPasswordTest.php
```

Quy tắc nhanh:

- File/class theo `PascalCase`.
- Method/biến theo `camelCase`.
- DB/API field theo `snake_case`.
- Action/Task có suffix đúng tầng.
- Không bỏ qua Request validation/authorization.
- Không query/filter dữ liệu trong Controller.
