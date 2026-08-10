# Workflow Checklist Laravel / Apiato

Checklist ngắn để đọc nhanh khi làm feature. Không reference trong `AGENTS.md`.

## 1. Wireframe

- UI nháp đơn giản: HTML, React, Figma, ảnh vẽ tay, markdown.
- Nhìn được: table, form, field, button, filter, search.
- Chốt: model/resource, endpoint, method, payload, response, quyền.
- UI state: `loading`, `error`, `empty`, `success`, `unauthorized`.

Ví dụ cực gọn:

```html
<h1>Sản phẩm</h1>
<input placeholder="Tìm tên" />
<button>Thêm</button>
<table>
  <tr>
    <th>Tên</th>
    <th>Giá</th>
    <th>Trạng thái</th>
    <th>Thao tác</th>
  </tr>
</table>
```

## 2. Database / Model

- Naming: table số nhiều, column `snake_case`.
- Migration: type, nullable, unique, default.
- Index: foreign key, filter, sort, compound index.
- Foreign key: cascade, set null, restrict.
- Soft delete nếu dữ liệu nghiệp vụ quan trọng.
- Model: `$fillable`, `$casts`, `$hidden`, relationships.
- Không dùng `$guarded = []` nếu không có lý do rõ.

## 3. Request

- Request riêng cho endpoint cần validate/authorize.
- Validate: required, nullable, type, max/min, exists, unique.
- Dùng `sometimes` cho các trường trong Update Request để hỗ trợ cập nhật từng phần (partial update) an toàn.
- Authorize cho API private.
- Apiato: `$access`, `$decode`, `$urlParameters`.
- Hash id decode ở Request.
- Không tin input client.

## 4. Porto Layer

- Flow: Route -> Controller -> Request -> Action -> Task -> Repository/Model -> Transformer.
- Controller mỏng: Chỉ nhận Request, gọi duy nhất 1 Action và trả về response.
- Action điều phối:
  - Chỉ chứa logic điều phối luồng nghiệp vụ.
  - Không truy vấn DB trực tiếp. Bắt buộc dùng `DB::transaction()` nếu có nhiều bước ghi dữ liệu.
- Task một nhiệm vụ (Single Responsibility - SRP):
  - Phân rã rõ ràng và tạo đầy đủ tất cả các Task nhỏ hỗ trợ (ví dụ: tạo riêng `CreateCustomerTask`, `FindProductByIdTask`, `UpdateProductStockTask`, `CreateOrderItemTask`...) thay vì gộp chung vào 1 Task lớn.
  - Đảm bảo tạo đủ tất cả các Task liên quan trước khi triển khai Action để đảm bảo tính tái sử dụng cao nhất.

- Repository data access.
- Tái sử dụng Task/Action có sẵn.
- Không query DB trong Controller.

## 5. Query / Performance

- Pagination/limit.
- Không `all()` cho list API.
- Filter ở database.
- N+1: audit cả Task query, Model permission method, Transformer/include/statistic.
- Eager loading: Task/Repository phải `with()` đủ relation mà Transformer/permission dùng trong collection.
- Chỉ cần số lượng thì dùng `withCount`, chỉ cần boolean thì dùng `withExists`.
- Pivot filter dùng `wherePivot(...)`/`wherePivotIn(...)`, không load collection rồi lọc PHP.
- Pivot có cột phụ/nghiệp vụ thì relation phải khai báo `using(CustomPivot::class)`, `withPivot(...)`, và `withTimestamps()` nếu có timestamp.
- Select cột cần dùng.
- Index đúng query.
- Không DB call trong loop.
- Transaction khi ghi nhiều bước.
- Exception chuyên biệt, không lộ SQL/raw error.

## 6. Transformer / Response

- `getHashedKey()`.
- Không lộ field nhạy cảm.
- Format date, money, decimal, boolean, enum.
- Includes: `availableIncludes`, `defaultIncludes`, `include{RelationName}()`.
- Response gọn, có pagination/meta khi cần.

## 7. Frontend Integration

- TypeScript type khớp API JSON.
- Loading/error/empty/success.
- Token/auth/router guard.
- Validation error hiển thị trên form.
- Không hardcode field ngoài API contract.

## 8. Test / Validator

- Unit: Task/Action.
- Functional: API public/private.
- Cases: success, validation, unauthorized, not found, edge case.
- Validators:
  - `composer validate --strict`
  - `vendor/bin/pint --test`
  - `vendor/bin/psalm --config=psalm.dist.xml`
  - `vendor/bin/phpunit`

## 9. Production

- Telescope/Debugbar/query log.
- Slow query.
- Cache/Redis.
- Rate limit.
- Queue/cache/session driver.
- Debug off.
- CORS/trusted proxies.
- Rollback migration.
- Không commit `.env`, log, cache, dump, secret.

## 10. Definition of Done

- Wireframe rõ.
- API contract rõ.
- Migration/model ổn.
- Request validate/authorize.
- Porto đúng tầng.
- Route bắt buộc có DocBlock `@api` đầy đủ:
  - Phân biệt rõ: `@apiParam` (cho URL params như `:id`), `@apiBody` (cho JSON body payload), và `@apiQuery` (cho query string).
- Chạy lệnh `php artisan apiato:apidoc` thành công, đầu ra sạch sẽ và **không còn bất kỳ cảnh báo (warning) nào**.
- Query có pagination, index, không N+1.
- Transformer sạch dữ liệu nhạy cảm.
- Frontend type và state đủ.
- Test/validator đã chạy.
- Không file rác, không secret, không ngoài scope.
