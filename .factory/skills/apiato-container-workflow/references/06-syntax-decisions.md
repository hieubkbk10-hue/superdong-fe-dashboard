# Syntax Decisions từ Laravel Dương

Chỉ kích hoạt rule khi feature có trigger tương ứng.

| Trigger                                 | Decision                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------- |
| Tên bảng dùng ở migration/validation/FK | Model `$table` + `getTableName()` là source of truth                              |
| Validation DB                           | `Rule::exists()`/`Rule::unique()` với `Model::getTableName()`, không magic string |
| Foreign key                             | Explicit column + `foreign()->references()->on(Model::getTableName())`            |
| Delete constraint                       | `cascadeOnDelete()`/`nullOnDelete()` thay `onDelete('...')`                       |
| Action create/update                    | `sanitizeInput()` whitelist và server-owned fields                                |
| Nested JSON input                       | Validate array keys, child types, count và size                                   |
| JSON persistence                        | Migration JSON + Model cast; không encode/decode thủ công                         |
| Model event tự update                   | `updateQuietly()`/`saveQuietly()` để tránh loop                                   |
| Static model helper                     | Dùng `static::` khi cần late static binding                                       |
| Secondary repository                    | Dùng pattern `Repository::instance()`/`builder()` nếu repo hỗ trợ                 |
| List/filter                             | `$fieldSearchable` + RequestCriteria + backend ownership criteria                 |
| Permission dùng ở HTTP/Job/CLI          | Model `canView/canEdit/canDelete` nhận actor ID                                   |
| Pivot có nghiệp vụ                      | Custom Pivot + `using()` + `withPivot()` + `withTimestamps()`                     |
| Pivot filtering                         | `wherePivot()`/`wherePivotIn()`, không lọc collection PHP                         |
| Sort/position                           | Backend tính trong đúng owner/scope, transaction + lock khi concurrent            |
| Event nhiều lifecycle phases            | Event DTO có phase/force/cause rõ, Listener không tự đoán                         |
| Listener reactions theo upstream domain | Subscriber `subscribe()` + EventServiceProvider                                   |
| Cascade/purge lớn                       | `chunkById()`, không load toàn bộ                                                 |
| Historical data                         | Snapshot fields/payload có tên rõ, không chỉ FK                                   |
| Restore child                           | `deleted_by_*` cause flags, không restore mọi child theo parent ID                |
| Transformer collection                  | Đọc relation đã load; `relationLoaded()` fallback chỉ khi cần                     |
| Count/existence                         | `withCount()`/`withExists()`                                                      |
| Default eager load nhiều endpoint       | Named global scope có tên và có thể tắt, không `$with` bừa                        |
| Side effect phụ thuộc DB                | `afterCommit()`/dispatch sau commit                                               |

## Accessor, mutator và getter

1. Cast xử lý kiểu dữ liệu đơn giản.
2. Accessor/mutator chỉ normalize persisted invariant.
3. Domain getter dành cho hành vi có tên nghiệp vụ.
4. Getter/accessor không query DB hoặc dispatch side effect.
5. Transformer không tự normalize khác Model.
6. Test cả persisted value và exposed value.

## Method naming

- Boolean: `isHidden()`, `canView()`, `hasMember()`.
- Use case: `CreateOrderAction`, `ReorderProductMediaTask`.
- Tránh `process()`, `handleData()`, `CommonTask`.
- Comment giải thích WHY, không mô tả WHAT đã rõ từ tên method.
