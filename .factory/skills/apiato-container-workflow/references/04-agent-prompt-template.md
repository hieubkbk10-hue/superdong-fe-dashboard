# Prompt Template cho từng bước

Mỗi bước trong workflow trả cho user phải có một prompt copy-paste hoàn chỉnh. Không dùng prompt kiểu “làm bước trên”.

## Template bắt buộc

```text
Bạn đang làm trong repo:
<absolute repo path đã audit>

Stack và quy chuẩn:
- Laravel 9, Apiato/Porto; xác nhận phiên bản thực tế từ composer.lock trước khi dùng generator/API.
- Đọc AGENTS.md và các standard/skill liên quan trước khi sửa.
- Nếu bước có schema/index/query/pagination/transaction/locking/bulk data, bắt buộc dùng `mysql-optimization`.
- Giữ flow Route -> Request -> Controller -> Action -> Task -> Repository/Model -> Transformer.
- Không đọc/in .env hoặc secret.
- Không đụng thay đổi không liên quan.
- Local-only workflow, tuyệt đối không push.

Trạng thái đầu vào:
- Base branch: master.
- Feature branch: feature/<slug>.
- Base commit: <exact hash captured at task 0>.
- Commit gần nhất đã hoàn tất: <hash/message hoặc none>.
- Feature/Container: <name>.
- Các bước 1..<N-1> đã hoàn tất và đã được kiểm tra.
- Các file/symbol đã tồn tại: <list>.
- Các invariant đã chốt: <list>.

Chỉ thực hiện bước <N>: <step name>.

Mục tiêu:
- <outcome 1>
- <outcome 2>

Việc phải làm:
1. <ordered task>
2. <ordered task>

Invariants không được phá:
- <business/security/data invariant>

Không làm:
- Không mở rộng sang bước kế tiếp.
- Không tạo dependency chưa nằm trong scope.
- Không query DB trong Controller/Transformer.
- Chỉ tạo đúng commit đã chỉ định cho task này.
- Không push.

Validation:
- <scoped test/lint/command>
- MySQL-triggered task: <EXPLAIN/EXPLAIN ANALYZE hoặc query-plan assertion phù hợp môi trường>.
- Nếu fail do code, sửa và chạy lại.
- Nếu fail do môi trường, báo command, exit code và lỗi chính.

Commit:
- Chỉ stage exact file allowlist thuộc bước này: <exact paths>.
- Review `git diff --cached` và `git status`.
- Commit message bắt buộc: `<type>(<scope>): <subject>`.
- Không amend/squash commit bước trước.
- Không push.

Rollback bước này:
- Điều kiện kích hoạt: <abort/failure condition>.
- Code/config: <exact revert/restore procedure>.
- Migration/schema: <exact path + command + expected schema>.
- Data/file/runtime: <reverse/compensation procedure hoặc not applicable + lý do>.
- Validation sau rollback: <commands/assertions>.
- Nếu rollback có nguy cơ mất dữ liệu, dừng và yêu cầu backup/xác nhận; không tự chạy destructive command.

Output:
- Observation kèm evidence file:line/command.
- Files changed.
- Validation result.
- Commit hash.
- Rollback readiness/result.
- Blocker hoặc assumption còn lại.
```

## Quy tắc sinh prompt

1. Nhắc lại repo path và stack.
2. Nêu rõ các bước trước đã xong.
3. Nêu symbol/data contract hiện đã tồn tại.
4. Chỉ cho agent sửa đúng phase.
5. Nêu invariant, không chỉ danh sách file.
6. Nêu validation riêng của bước.
7. Không yêu cầu agent “tự quyết” business contract đã chốt.
8. Không nhét nhiều phase độc lập vào một prompt.
9. Prompt relation phải xác nhận cả hai Model đã tồn tại.
10. Prompt queue phải nêu backend, queue name, afterCommit, retry và worker.
11. Prompt phải nêu feature branch và local-only/no-push.
12. Prompt phải có exact commit message, không dùng “commit thay đổi”.
13. Prompt migration phải có exact rollback path, command và schema/data assertion.
14. Prompt data migration phải phân biệt reversible, backup-required và irreversible.
15. Prompt N phải có rollback độc lập; workflow tổng rollback theo dependency edges đảo chiều, không đảo số task máy móc.
16. Prompt có MySQL trigger phải ghi data types/nullability, composite-index column order, query shape, offset/deferred-join/keyset decision, keyset stable order/unique tie-breaker/cursor predicate/supporting index nếu dùng, lock order/deadlock risk, EXPLAIN expectation và index rollback.

## Template bước 0 Git preflight

```text
Chỉ thực hiện bước 0: chuẩn bị local feature branch.

Preflight bắt buộc:
1. Chạy git status, git diff, git diff --cached và kiểm tra merge/rebase/cherry-pick dang dở.
2. Xác nhận branch hiện tại là master và working tree sạch.
3. Nếu có tracked/untracked user-owned changes, dừng và báo; không stash, clean, reset hoặc overwrite.
4. Tạo branch `feature/<slug>` từ master.
5. Xác nhận branch mới và HEAD base.
6. Ghi exact base commit vào workflow artifact/rollback manifest.

Không sửa feature, không commit rỗng, không push.

Rollback:
- Nếu chưa có commit feature: quay lại master và xóa branch bằng `git branch -d`.
- Nếu đã có commit chưa merge: không force-delete; yêu cầu xác nhận abort trước.
```

## Template bước dependency foundation

```text
Các bước audit/contract đã hoàn tất. Chỉ hoàn thiện foundation của Container <Dependency>.

Contract mà feature chính cần:
- <required field/invariant/API contract>.

Tạo đủ Model, Migration, Factory và Repository để contract trên hoạt động độc lập.
Không tạo model rỗng chỉ để compile.
Chưa thêm relation sang feature chính ở bước này.

Chạy migration up/down/up và tests scoped của Container.
```

## Template bước cross-container relation

```text
Foundations của <A>, <B> và migrations tương ứng đã hoàn tất.
Chỉ nối cross-container relation.

Thực hiện:
- Relation phía A.
- Relation phía B.
- Alias/morph map nếu polymorphic.
- Không nhận FQCN từ API.
- Tests inverse relation, cross-owner và stored type.

Không sửa schema/business fields ngoài relation contract.
```

## Template bước queue

```text
Core synchronous use case và transaction đã hoàn tất.
Chỉ triển khai phase queue cho side effect <name>.

Đầu vào đã chốt:
- Queue backend: <database/redis/sqs>.
- Queue name: <name>.
- Dispatch point: sau commit.
- Payload: <IDs/DTO>.

Thực hiện Job/Listener/Provider, idempotency, tries, backoff, timeout,
failed(), tests và worker/deploy runbook. Bảo đảm timeout < retry_after.
Không chuyển core write bắt buộc sang async.
```

## Template final gate

```text
Toàn bộ implementation steps đã hoàn tất trên `feature/<slug>`. Không thêm feature mới.

Trace đủ dependency closure và chạy validators phù hợp.
Kiểm tra security, Hash ID, permissions, transaction, N+1, side effects,
queue/runtime, docs và workspace hygiene.

Nếu validators pass:
1. Xác nhận working tree feature branch sạch.
2. Chuyển về master.
3. Xác nhận master sạch và kiểm tra ancestry/divergence so với base commit đã ghi ở task 0.
4. Merge local bằng `git merge --no-ff feature/<slug>`.
5. Chạy exact smoke commands đã ghi trong artifact sau merge.
6. Xác nhận commits của mọi task nằm trong master.
7. Xóa local feature branch bằng `git branch -d feature/<slug>`.

Không push. Nếu merge conflict hoặc validator sau merge fail, dừng; không xóa branch.
Trả kết quả theo Observation, Inference, Decision, evidence, merge commit và branch cleanup.
```

## Template abort toàn workflow

```text
User đã yêu cầu hủy workflow tại task <N>. Dừng mọi implementation mới.

Từ rollback manifest, tính reverse-topological order theo dependency edges của các task đã bắt đầu/hoàn tất; không chỉ đảo số task máy móc.

Nếu task hiện tại đang dở và chưa commit:
1. Chạy rollback runtime/data/migration của phần đã thực thi trước.
2. Dùng exact file allowlist của task để restore tracked files và xóa đúng untracked files do task tạo.
3. Không xóa file ngoài allowlist và không chạm user-owned changes.
4. Chạy rollback validation rồi mới rollback các task đã commit.

Với mỗi task:
1. Chạy git status, git diff và git diff --cached; dừng nếu có user-owned changes mới.
2. Dừng producer/worker/side effect liên quan.
3. Thực hiện rollback data/storage trước khi rollback schema nếu dependency yêu cầu.
4. Rollback migration bằng exact path đã ghi trong task.
5. Revert commit task mà không chạm user-owned changes.
6. Chạy rollback validation.

Sau khi toàn bộ rollback pass:
1. Xác nhận feature branch không còn thay đổi cần giữ.
2. Quay về master và xác nhận master không bị thay đổi.
3. Nhánh chưa merge chỉ được force-delete sau xác nhận rõ vì thao tác này có thể mất commit.
4. Không push.

Nếu rollback irreversible hoặc có nguy cơ mất dữ liệu, dừng tại task đó và báo recovery procedure.
```
