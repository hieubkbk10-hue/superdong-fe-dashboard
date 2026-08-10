---
name: apiato-container-workflow
version: 1.1.0
description: |
  Use when the user asks for a manual coding workflow, ordered implementation steps, dependency-aware plan, copy-paste prompts, or a filtered checklist for creating or completing Laravel 9 Apiato/Porto Containers and related features in this repository.
---

# Apiato Container Workflow

Tạo một workflow tổng đầy đủ, sau đó lọc thành quy trình ngắn đúng với feature được yêu cầu. Không trả checklist CRUD máy móc và không lập kế hoạch cho một Container cô lập khi nghiệp vụ cần dependency khác.

**REQUIRED BACKGROUND:** Dùng `apiato`, `laravel-duong` và `laravel-apiato-qa`.

**CONDITIONAL REQUIRED SUB-SKILL:** Dùng `mysql-optimization` trước khi chốt plan nếu scope có Migration/schema/index, relation, Repository/query, search/filter/sort, pagination, transaction, locking/concurrency hoặc bulk data. Không gọi skill này cho workflow chỉ có Mail/Notification/config không đụng data access.

## Hard rules

1. Đọc `AGENTS.md`, standard liên quan và code hiện tại trước khi lập quy trình.
2. Biến yêu cầu `A` thành scope toàn vẹn `A' = A + dependency tối thiểu cần thiết`.
3. Không tạo dependency giả chỉ để compile. Dependency phải đủ contract nghiệp vụ mà feature cần.
4. Sắp xếp theo dependency graph, không theo thứ tự file generator.
5. Chỉ nối relation khi cả hai đầu Model/Migration đã tồn tại.
6. Optional trở thành bắt buộc khi trigger của capability xuất hiện.
7. Không sao chép pattern xấu từ repo tham khảo. Phân biệt evidence, inference và decision.
8. Mỗi bước phải độc lập để giao cho agent khác và có prompt copy-paste.
9. Prompt bước N phải tự chứa repo context, prerequisite, symbols, invariants, validation, exact commit message và rollback procedure.
10. Khi user chỉ xin quy trình, không viết code hoặc sửa file feature.
11. Workflow dài phải lưu thành Markdown tại `$HOME\Downloads\Current Task`; tự tạo thư mục nếu chưa có.
12. Không đổ toàn bộ workflow dài vào chat. Chỉ trả tên file, đường dẫn, scope, số bước và blocker chính.
13. Workflow phải có Mermaid flow diagram cho dependency graph và hai nhánh kết thúc: complete/abort.
14. Git mặc định local-only: bước 0 tạo `feature/<slug>`, mỗi implementation task có file changes tạo đúng một commit, final gate merge local vào `master`, rồi xóa feature branch. Không push.
15. Abort phải rollback theo thứ tự topo ngược. Không force-delete nhánh chưa merge nếu chưa có xác nhận rõ.
16. Khi trigger MySQL xuất hiện, workflow phải ghi index strategy, query shape/pagination, transaction/lock risk, `EXPLAIN` validation và schema/index rollback.

## Workflow

### 1. Audit

- Xác định trạng thái thật của Container, Model, Migration, API, test và dependency.
- Kiểm tra Git status, branch gốc, merge/rebase dang dở và user-owned changes.
- Xác định generator phù hợp:
  - CRUD đơn giản: `php artisan create-api`.
  - Container cần chọn API/WEB, Events, Listeners, Tests, Providers: `php artisan apiato:generate:container`.
- Chạy `--help` trước khi ghi lựa chọn generator.

### 2. Dependency closure

Lập graph:

```txt
feature requested
-> aggregate roots/owners
-> schema and models
-> cross-container contracts
-> relations
-> use cases
-> side effects/runtime
-> tests/docs/deploy
```

Nếu dependency chưa tồn tại, đưa phase tạo dependency vào trước. Không thêm relation, fallback, Transformer include hoặc permission dựa trên class chưa tồn tại.

### 3. Activate capabilities

Đọc `references/01-capability-matrix.md`. Chỉ bật module có trigger, nhưng giữ nguyên prerequisite và thứ tự của module.

Nếu bất kỳ capability MySQL nào được kích hoạt, gọi `mysql-optimization` trước khi chốt schema/query/transaction task và đưa kết quả audit vào artifact.

### 4. Topological ordering

Thứ tự mặc định:

```txt
Contract
-> dependency Containers
-> Config
-> Model table source
-> Migration
-> migrate up/down/up
-> Relations
-> Repository/Factory
-> Tasks
-> Action/transaction
-> Request
-> Transformer
-> Controller/Route
-> lifecycle/side effects
-> queue/runtime
-> tests/apidoc/validators
```

Điều chỉnh theo graph thực tế, không đảo bước khiến code tham chiếu dependency chưa tồn tại.

### 5. Add Git and rollback lifecycle

Workflow luôn có:

```txt
preflight clean master
-> create feature/<slug>
-> task commits theo topo
-> final validators
-> local merge --no-ff vào master
-> verify merge
-> delete feature branch
```

Nhánh hủy:

```txt
stop new work
-> rollback started/completed leaf tasks theo dependency edges
-> chỉ rollback prerequisite sau khi mọi dependent đã rollback
-> verify schema/data/files/runtime
-> return master
-> delete unmerged branch only after explicit confirmation
```

Mỗi task phải có commit message Conventional Commit cụ thể và rollback riêng cho code, migration/data, side effect/runtime cùng lệnh kiểm tra sau rollback.

### 6. Produce the workflow artifact

Target:

```txt
$HOME\Downloads\Current Task\YYYY-MM-DD-HHmmss-<feature-slug>-workflow.md
```

- Resolve home directory của máy hiện tại, không hardcode username.
- Tạo `Downloads\Current Task` nếu chưa tồn tại.
- Tên file phải tránh ghi đè workflow cũ.
- File phải có Mermaid dependency diagram và execution lifecycle diagram.
- Nếu workflow chỉ có 1-2 bước ngắn, vẫn ưu tiên artifact khi user yêu cầu workflow topo.

Mỗi bước dùng đúng format:

    ## N. Tên bước
    - Mục tiêu:
    - Phụ thuộc đã hoàn tất:
    - Việc cần làm:
    - Kiểm tra:
    - Commit:
    - Rollback:

    ### Prompt giao agent
    [Ngữ cảnh repo và trạng thái các bước trước]
    [Chỉ làm đúng bước này]
    [Danh sách file/symbol và invariant]
    [Validation bắt buộc]
    [Exact files được stage và exact commit message]
    [Rollback code/migration/data/runtime và rollback validation]
    [Không mở rộng scope, không push]

Chỉ giữ các bước cần cho `A'`. Không giữ mục optional không được kích hoạt.

### 7. Integrity review

Trước khi trả workflow, kiểm tra:

- Mọi symbol được dùng đã có bước tạo trước đó.
- Relation chỉ xuất hiện sau hai đầu dependency.
- Migration đã chốt snapshot, delete semantics, index và FK.
- Core write nằm trong transaction phù hợp.
- Side effect phụ thuộc DB chạy sau commit.
- Queue có worker/runtime/deploy, không chỉ có Job class.
- Tests bao phủ dependency closure và rollback.
- Mỗi bước có prompt và giả định rõ trạng thái trước bước.
- Mỗi migration có rollback path, data-loss guard và up/down/up verification.
- Commit message khớp scope task; task chỉ stage file liên quan.
- Forward order và rollback order là hai graph đảo chiều hợp lệ.
- Artifact có rollback manifest: task, dependency edges, commit hash, migration paths và rollback command.
- Final merge chỉ chạy khi validators pass và working tree sạch.
- Workflow artifact tồn tại, đọc được và không bị truncate.

## References

- `references/00-dependency-closure-and-output.md`
- `references/01-capability-matrix.md`
- `references/02-container-build-order.md`
- `references/03-queue-worker-runtime.md`
- `references/04-agent-prompt-template.md`
- `references/05-red-flags.md`
- `references/06-syntax-decisions.md`
- `references/07-workflow-artifact-git-rollback.md`

## Common mistakes

- Lập workflow “chỉ Media” nhưng Product/Customer contract chưa tồn tại.
- Tạo Product/Customer rỗng chỉ để Media compile.
- Khai báo relation trước khi Model dependency tồn tại.
- Viết Job nhưng quên queue connection, worker, retry, idempotency và deploy.
- Dispatch mail/file/realtime trước commit.
- Prompt bước sau không nói các bước trước đã hoàn tất.
- Trả workflow tổng chưa lọc, khiến user phải tự loại bước.
- Dán hàng nghìn dòng workflow vào chat thay vì tạo artifact.
- Chỉ ghi “revert commit” mà không rollback migration/data/runtime.
- Tạo feature branch nhưng không có final merge/delete hoặc abort path.
- Xóa nhánh chưa merge bằng force mà không xác nhận.
- Có schema/query/locking trigger nhưng không dùng `mysql-optimization` hoặc chỉ ghi index chung chung.
