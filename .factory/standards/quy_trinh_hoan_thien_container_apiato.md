# Quy trình hoàn thiện một Container Apiato

## Quy tắc

- Làm hoàn chỉnh một Container rồi mới chuyển sang Container khác.
- Một Container có một model nghiệp vụ chính.
- Model con, pivot, item, file, log, history hoặc snapshot không có lifecycle/API riêng nằm cùng Container chính.
- Mục có `(optional)` chỉ thực hiện khi nghiệp vụ cần.

## Thứ tự thực hiện

### 1. Chốt nghiệp vụ

1. Xác định Section và Container.
2. Xác định model chính và model phụ `(optional)`.
3. Xác định field, quan hệ, quyền, API và lifecycle.
4. Xác định SoftDelete, transaction, event và tác vụ nền `(optional)`.

### 2. Chọn cách sinh Container

CRUD thông thường:

```bash
php artisan create-api
```

Container phức tạp có nhiều Event, Listener, Job, Notification hoặc Provider:

```bash
php artisan apiato:generate:container
```

Sau đó sinh từng thành phần cần thiết bằng generator Apiato.

### 3. Config `(optional)`

1. Tạo Config.
2. Khai báo enum, default hoặc giới hạn nghiệp vụ.

### 4. Model

1. Tạo model chính.
2. Tạo model phụ/pivot `(optional)`.
3. Khai báo `$table`.
4. Khai báo `getTableName()`.
5. Khai báo `$fillable`.
6. Khai báo `$casts`.
7. Khai báo `$hidden` `(optional)`.
8. Khai báo `$resourceKey`.
9. Thêm `SoftDeletes` `(optional)`.
10. Thêm accessor, mutator hoặc domain getter `get...()` `(optional)`.

### 5. Migration

1. Import các Model liên quan.
2. Dùng `Model::getTableName()` cho tên bảng.
3. Khai báo primary key.
4. Khai báo các column nghiệp vụ.
5. Khai báo column quan hệ.
6. Khai báo foreign key.
7. Khai báo `cascadeOnDelete()`, `nullOnDelete()` hoặc `restrictOnDelete()`.
8. Khai báo index.
9. Khai báo unique.
10. Thêm `$table->softDeletes()` `(optional)`.
11. Tạo bảng cha trước bảng con.
12. Trong `down()`, xóa bảng con trước bảng cha.
13. Kiểm tra migration:

```bash
php artisan migrate
php artisan migrate:rollback
php artisan migrate
```

### 6. Quan hệ trong Model `(optional)`

1. Khai báo `belongsTo` `(optional)`.
2. Khai báo `hasOne` `(optional)`.
3. Khai báo `hasMany` `(optional)`.
4. Khai báo `belongsToMany` `(optional)`.
5. Khai báo method quan hệ: `user()`, `board()`, `items()` `(optional)`.
6. Pivot dùng `PivotModel::getTableName()` `(optional)`.

### 7. Logic trong Model `(optional)`

1. Thêm `canView()`.
2. Thêm `canEdit()`.
3. Thêm `canDelete()`.
4. Thêm domain getter hoặc helper `get...()`.
5. Thêm `protected static function booted()` cho lifecycle áp dụng trên mọi đường ghi dữ liệu.
6. Dùng `saveQuietly()` hoặc `updateQuietly()` nếu callback tự cập nhật model.
7. Không đặt use case, Request hoặc transaction lớn trong `booted()`.

### 8. Factory và Seeder `(optional)`

1. Hoàn thiện Factory.
2. Tạo Seeder dữ liệu mặc định `(optional)`.
3. Tạo Seeder permission `(optional)`.

### 9. Repository

1. Khai báo model.
2. Khai báo `$fieldSearchable` `(optional)`.
3. Chỉ expose field tìm kiếm/lọc an toàn.

### 10. Task

1. Tạo Task nhỏ cho từng thao tác.
2. Task nhận scalar/array, không nhận Request.
3. Query và mutation qua Repository.
4. List dùng criteria, scope quyền, eager load và paginate `(optional)`.
5. Tạo Task xử lý file/media `(optional)`.
6. Tạo Task ghi log/history/snapshot `(optional)`.

### 11. Action

1. Nhận Request.
2. Dùng `sanitizeInput()`.
3. Bổ sung dữ liệu do server quản lý.
4. Điều phối Task/SubAction.
5. Thêm transaction cho workflow ghi nhiều bảng `(optional)`.
6. Rollback toàn bộ core write khi có lỗi `(optional)`.
7. Chỉ dispatch side effect sau khi core write thành công `(optional)`.

### 12. Request

1. Khai báo `$access` `(optional)`.
2. Khai báo `$decode` `(optional)`.
3. Khai báo `$urlParameters` `(optional)`.
4. Hoàn thiện `rules()`.
5. Hoàn thiện `authorize()`.
6. Thêm giới hạn cho string, array, file, limit và batch input.
7. Update Request dùng `sometimes`.

### 13. Transformer

1. Trả ID bằng `getHashedKey()`.
2. Khai báo public response fields.
3. Khai báo `$availableIncludes` `(optional)`.
4. Khai báo `$defaultIncludes` `(optional)`.
5. Thêm method include quan hệ `(optional)`.
6. Không query nặng trong Transformer.

### 14. Controller

1. Nhận Request.
2. Gọi một Action.
3. Trả Transformer hoặc response phù hợp.

### 15. Route

1. Tạo Route.
2. Khai báo HTTP method và URI.
3. Khai báo auth middleware `(optional: private route)`.
4. Hoàn thiện DocBlock `@api`.
5. Đồng bộ `@apiPermission` với Request.

### 16. SoftDelete flow `(optional)`

1. Migration thêm `$table->softDeletes()`.
2. Model thêm `use SoftDeletes`.
3. Thêm Delete Task/Action/Request/Route.
4. Thêm Restore Task/Action/Request/Route.
5. Thêm ForceDelete/Purge flow `(optional)`.
6. Thêm cleanup file/media khi force delete `(optional)`.
7. Thêm cascade soft delete/restore bằng Event/Listener hoặc `booted()` `(optional)`.

### 17. Event và tác vụ phụ `(optional)`

1. Xác định thời điểm phát sinh event và payload tối thiểu.
2. Tạo Event.
3. Tạo Task/Action xử lý side effect.
4. Tạo Notification `(optional)`.
5. Tạo Job cho tác vụ chậm hoặc bên ngoài hệ thống `(optional)`.
6. Tạo Listener.
7. Listener gọi Task/Action, Notification hoặc dispatch Job.
8. Đặt queue, retry, idempotent và `$afterCommit = true` `(optional)`.
9. Tạo `EventServiceProvider`.
10. Đăng ký Event/Listener trong `EventServiceProvider`.
11. Đăng ký `EventServiceProvider` trong `MainServiceProvider`.
12. Dispatch Event sau commit trong Action.
13. Chỉ dispatch từ `booted()` khi side effect phải áp dụng cho mọi lifecycle path `(optional)`.

### 18. Tests

1. Unit test cho Task, Action và Model logic.
2. Functional test cho Route.
3. Test success, validation, unauthorized, not found và edge case.
4. Test transaction rollback `(optional)`.
5. Test SoftDelete/Restore/ForceDelete `(optional)`.
6. Test Event/Listener/Job/Notification `(optional)`.

### 19. Validators

```bash
composer validate --strict
vendor/bin/php-cs-fixer fix --config=php_cs.dist.php --dry-run --diff
vendor/bin/psalm --config=psalm.dist.xml
vendor/bin/phpunit
php artisan apiato:apidoc
```
