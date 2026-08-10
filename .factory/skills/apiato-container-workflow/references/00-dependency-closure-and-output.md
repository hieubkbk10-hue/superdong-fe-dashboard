# Dependency Closure và Output Contract

## 1. Biến yêu cầu A thành A'

```txt
A = feature user gọi tên

A' =
  A
  + dependency bắt buộc để compile
  + dependency bắt buộc để đúng nghiệp vụ
  + integration contract
  + runtime cần để feature thật sự chạy
  + tests chứng minh toàn vẹn
```

Không tự mở rộng sang nghiệp vụ không phục vụ trực tiếp cho A.

## 2. Phân loại dependency

| Loại                     | Xử lý                                                                      |
| ------------------------ | -------------------------------------------------------------------------- |
| Compile dependency       | Tạo trước khi class khác import hoặc type-hint                             |
| Schema dependency        | Chốt Model/table trước Migration/FK/validation                             |
| Business dependency      | Phải có đủ field/invariant feature sử dụng, không tạo model rỗng           |
| Cross-container contract | Chốt owner, IDs, permission, relation và response trước integration        |
| Runtime dependency       | Queue worker, scheduler, storage, provider, config/env phải có phase riêng |
| Future dependency        | Không code sẵn; ghi extension point nếu chưa cần cho A'                    |

## 3. Thuật toán đóng scope

1. Đọc trạng thái thật của repo.
2. Liệt kê outputs mà feature hứa với API/UI/business.
3. Với mỗi output, truy ngược dữ liệu và hành vi cần có.
4. Với mỗi class/table/config chưa tồn tại, thêm node dependency.
5. Với mỗi side effect, thêm runtime node.
6. Với mỗi invariant, thêm test node.
7. Loại node không phục vụ output hoặc invariant.
8. Sắp xếp graph theo topological order.
9. Trình bày rõ `A -> A'` trước workflow.

## 4. Quy tắc khi dependency chưa tồn tại

- Không khai báo relation tới class chưa tồn tại.
- Không viết Transformer fallback phụ thuộc Customer nếu Customer chưa có `name`.
- Không tạo Customer chỉ có `id` nếu avatar fallback cần `name`.
- Không tạo Product chỉ có `id` nếu feature cần ownership, status hoặc SKU.
- Nếu business contract dependency chưa rõ và có nhiều hướng ảnh hưởng API/data, hỏi user trước.
- Nếu chỉ có một contract tối thiểu an toàn, đưa nó vào A' và ghi assumption.

## 5. Canonical Media closure

Yêu cầu:

```txt
Media cho Product tối đa 9 ảnh,
Customer tối đa 1 ảnh,
Customer không có ảnh thì tạo avatar từ tên.
```

Closure đúng:

```txt
Product contract tối thiểu phục vụ media
Customer contract tối thiểu có name phục vụ avatar fallback
Media persistence và storage
Product + Customer + Media migrations/models hoạt động độc lập
Cross-container morph contract
Upload/replace/reorder/delete
Fallback resolver và Customer response integration
Cleanup event/listener/job nếu cần
Queue worker/runtime nếu xử lý thumbnail/cleanup async
Cross-container tests
```

Thứ tự:

```txt
Chốt Product/Customer/Media contract
-> tạo và migrate Product + Customer foundations
-> tạo và migrate Media foundation
-> nối relation/morph map
-> viết Media use cases
-> tích hợp Customer avatar response
-> side effects/runtime
-> cross-container tests
```

## 6. Output bắt buộc

Workflow Markdown phải có:

1. `Scope điều chỉnh`: A và A'.
2. `Assumptions`: chỉ các assumption chưa có evidence.
3. Mermaid dependency graph thể hiện topo forward.
4. Mermaid lifecycle graph có complete và abort path.
5. Git preflight, feature branch name và base branch.
6. Các bước đã lọc.
7. Prompt copy-paste self-contained dưới từng bước.
8. Exact commit message cho từng bước.
9. Rollback code, migration/data, file/runtime và validation cho từng bước.
10. Rollback tổng theo thứ tự topo ngược.
11. Final local merge vào `master`, verify và xóa feature branch.
12. Definition of Done theo invariant.
13. Không chèn code triển khai khi user chỉ xin quy trình.

Khi `mysql-optimization` được kích hoạt, artifact phải thêm:

- data type và nullability decisions;
- index strategy, thứ tự composite index và query được index phục vụ;
- query shape, selected columns và pagination strategy; nếu dùng keyset/cursor phải chốt stable ordering, unique tie-breaker, cursor predicate và supporting index;
- transaction scope, lock order, contention/deadlock/retry risk;
- `EXPLAIN`/query-plan validation cùng expected access type/index;
- rollback migration/index và performance assertion sau rollback.

## 7. Artifact contract

Workflow topo không trả toàn bộ trong chat. Lưu tại:

```txt
$HOME\Downloads\Current Task\YYYY-MM-DD-HHmmss-<feature-slug>-workflow.md
```

Quy tắc:

1. Resolve `$HOME` của máy hiện tại, không hardcode `C:\Users\VTOS`.
2. Tạo `Downloads\Current Task` nếu chưa tồn tại.
3. Timestamp tới giây và collision suffix phải tránh overwrite.
4. Đọc lại file sau khi ghi để xác nhận header, diagram, task đầu/cuối và rollback section tồn tại.
5. Chat chỉ trả:
   - đường dẫn file;
   - scope A';
   - số task;
   - branch dự kiến;
   - assumption/blocker cần user biết.

## 8. Rollback closure

Với graph forward:

```txt
A -> B -> C -> D
```

Rollback phải là:

```txt
D -> C -> B -> A
```

Mỗi task phân loại:

| Loại thay đổi           | Rollback bắt buộc                                                     |
| ----------------------- | --------------------------------------------------------------------- |
| Code/config             | Revert exact task commit hoặc restore exact files                     |
| Migration schema        | Exact migration path, rollback command và schema assertion            |
| Data migration/backfill | Backup/precondition, reverse transform hoặc đánh dấu irreversible     |
| File/storage            | Xóa file mới hoặc phục hồi file cũ theo transaction state             |
| Queue/runtime           | Dừng producer trước consumer, drain/cancel jobs, revert worker/config |
| Permissions/seed        | Revoke đúng permission/seeded rows, không xóa dữ liệu ngoài scope     |

Không gọi rollback “an toàn” nếu có thể mất dữ liệu. Trường hợp irreversible phải ghi stop condition, backup requirement và recovery procedure.
