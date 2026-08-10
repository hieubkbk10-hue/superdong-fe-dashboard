# 6) Business Thinking / Tư duy nghiệp vụ

File này không lặp syntax/layer. Chỉ giúp AI agent nghĩ đúng domain trước khi code.

## 6.1) Domain map

```txt
Workspace
-> Board
-> Project
-> Work
-> Comment
```

Domain phụ:

- `Invite`: mời user vào workspace.
- `Notification`: lưu payload denormalized để hiển thị realtime/in-app.
- `Statistic`: dashboard theo workspace/board/user/time.
- `Config`: dữ liệu bootstrap cho frontend.

## 6.2) Quyền luôn đi theo parent chain

Trước khi code, trả lời:

```txt
User thuộc workspace nào?
Board public hay private?
Entity có hide không?
User là owner/admin/member/assignee/requester/author?
Action cần canView, canEdit hay canDelete?
```

Rule:

- Workspace là gốc membership.
- Board có membership riêng và type `public/private`.
- Project kế thừa quyền từ Board/Workspace.
- Work có owner `user_id`, requester, assignees, viewers, followers.
- Comment xem theo Work, sửa theo author, xóa theo author hoặc quyền xóa Work.
- Child Work kế thừa quyền từ parent.

## 6.3) Visibility và realtime là một cặp

Data có thể bị ẩn bởi:

- `workspace` membership inactive.
- `board.type = private`.
- `board.hide`.
- `project.hide`.
- `work.hide`.

Rule:

- List API mặc định không trả hidden data.
- Hidden data chỉ gửi owner/admin đúng cấp.
- Khi entity đổi visibility, realtime có thể là delete khỏi client này nhưng create/update cho client khác.
- Private board gửi active board members.
- Public board gửi active workspace members.

## 6.4) Status, done, review

Status không phải string tự do:

- Workspace/Board config định nghĩa `active`, `pending`, `done`.
- Work status phải nằm trong status của Board.
- Board đổi status/tag thì Work cũ cần normalize.

Khi Work chuyển done:

- `done = true`.
- `completed_at = now()`.
- `priority = null`.
- Tính `points`.
- Có thể gửi notification completed.

Review flow:

```txt
request review/report
-> reviewer là board member
-> board bật config review
-> approve/reject/forward
-> review có thể chuyển từ review sang report
```

## 6.5) Hierarchy và sort

Rule:

- Work chỉ cho child dưới parent top-level.
- `level`, `parent_id`, `sort`, `show_kanban` liên quan nhau.
- Parent đổi hide/project có thể lan xuống children.
- Delete/restore parent phải xử lý children và `deleted_by_parent`.
- Sort phải tính theo scope: cùng project, cùng parent, cùng board.

Không nhận sort/order tùy tiện từ client nếu backend có thể tự tính theo context.

## 6.6) Recurrence và today

Work schedule hỗ trợ:

```txt
date / week / month / quarter / year
deadline / stop / time / include
```

Rule:

- Recurrence chỉ chạy khi project open, board/project/work không hidden, user enable, member active.
- Work recurring không giống duplicate thủ công.
- `include` quyết định copy description, children, checklist, persons.
- `today` là marker theo ngày, phải đồng bộ với WorkHistory.
- Reset today là job/command theo ngày, không chỉ update field thủ công.

## 6.7) Member lifecycle

Khi thêm/xóa member, đừng chỉ `sync()` máy móc.

Rule:

- Luôn giữ owner.
- User có data trong workspace/board thì ưu tiên `active=false` thay vì detach sạch.
- Khi remove assignee khỏi work, cleanup follower/viewer/log/like/viewer comment liên quan.
- Nếu owner/user bị xóa, cần transfer hoặc cleanup dữ liệu liên quan.
- Invite đã approve có thể attach user sau khi user đăng ký.

## 6.8) Audit, notification, denormalized data

Rule:

- Work log/history là dữ liệu nghiệp vụ, không chỉ debug.
- Notification payload chứa snapshot board/project/work/comment/user.
- Khi entity đổi tên hoặc bị xóa, Notification listener có thể phải update/delete payload cũ.
- File trong comment/work/review cần cleanup khi delete/force delete.
- Realtime payload nên đi qua Transformer để UI nhận shape ổn định.

## 6.9) Default onboarding data

Workspace mới không trống hoàn toàn:

- Generate slug.
- Seed config statuses/tags.
- Tạo board private.
- Tạo project mặc định.
- Tạo sample works, child works, checklist, comments.

Rule:

- Đừng xóa default data flow nếu không có yêu cầu rõ.
- Nếu thay đổi status/tag default, kiểm tra workspace create, board create, work sample, frontend config.

## 6.10) Câu hỏi bắt buộc trước khi code

1. Entity thuộc parent nào và parent có hidden/private không?
2. User đang thao tác là owner/admin/member/assignee/requester/author?
3. Action này cần view, edit hay delete?
4. Có ảnh hưởng realtime room nào?
5. Có cần log/history/notification không?
6. Có cần cleanup file hoặc denormalized notification không?
7. Delete là soft, force, hay detach/inactive?
8. Nếu restore, khôi phục những child nào và vì sao?
9. Nếu list, query đã scope quyền và paginate chưa?
10. Nếu dùng JSON config, shape và default đến từ đâu?

## 6.11) Tư duy aggregate trước CRUD

Backend phải nhìn entity như một cụm nghiệp vụ, không chỉ bảng DB.

```txt
Root: ai sở hữu, ai được xem/sửa/xóa?
Children: sống chết theo root hay độc lập?
Pivots: chỉ nối bảng hay có role/active/main?
Logs/history: có phải audit trail không?
Snapshots: dữ liệu nào phải giữ nguyên theo thời điểm?
Side effects: notification/realtime/file cleanup/purge?
```

Áp dụng vào repo:

- Workspace là gốc membership.
- Board là không gian làm việc trong Workspace, có public/private/hide.
- Project nhóm Work theo Board.
- Work là aggregate lớn, có child work, files, logs, histories, reviews, persons, viewers, followers.
- Comment là entity riêng vì có endpoint, quyền tác giả, realtime, notification, like/viewer.

Decision:

- Tạo container mới khi business gọi tên entity như một tài nguyên độc lập.
- Tạo model con trong container cha khi dữ liệu chỉ phục vụ root.
- Không để “có table” tự động biến thành “có container”.

## 6.12) Model aggregate hợp lý

Một aggregate hợp lý phải trả lời được:

1. Root id là gì?
2. Giao dịch tạo/sửa/xóa root có cần ghi những child nào?
3. Nếu root rollback, child/side effect có rollback theo không?
4. Nếu root soft delete, child restore thế nào?
5. Nếu root force delete, file/media/snapshot xử lý thế nào?

Ví dụ `Work`:

- Create Work có thể tạo files, sync persons, tạo history today, gửi realtime.
- Update Work có thể sync persons/files/log/history, dispatch update event, gửi realtime theo visibility.
- Delete Work có thể delete children bằng `deleted_by_parent`, gửi realtime, sau đó purge cleanup file.

Vì vậy `Work` không phải CRUD đơn giản, mà là aggregate root.

## 6.13) Khi nào phải snapshot

Snapshot là câu trả lời cho câu hỏi: “Sau này dữ liệu gốc đổi/xóa thì lịch sử còn đúng không?”

Phải snapshot:

- Đơn hàng: tên sản phẩm, SKU, giá, thuế, giảm giá tại thời điểm mua.
- Vận chuyển: tên/sđt/địa chỉ người gửi và người nhận tại thời điểm tạo đơn.
- Notification/audit: tên board/project/work/comment/user tại thời điểm phát sinh nếu UI cần đọc lại.
- Payment/refund: amount, currency, provider reference, fee, exchange rate.

Không nên chỉ FK khi:

- Giá/tên có thể đổi.
- FK có thể `nullOnDelete`.
- Entity gốc có thể bị force delete.
- Báo cáo pháp lý/tài chính cần số liệu tại thời điểm phát sinh.

Backend phải phản biện nếu khách bảo “lưu product_id là đủ”.

## 6.14) Khi nào dùng SoftDelete

Dùng SoftDelete khi business cần:

- Khôi phục nhầm xóa.
- Trash/recycle bin.
- Grace period trước force delete.
- Cascade mềm rồi restore đúng child.
- Giữ link cho notification/log trong thời gian ngắn.

Không dùng SoftDelete khi:

- Dữ liệu là pivot phụ, like/viewer, temp token.
- Không có màn hình/flow restore.
- Record là log/history cần bất biến.
- Legal/privacy yêu cầu xóa vĩnh viễn hoặc anonymize.

Nếu dùng SoftDelete cho parent-child, phải thiết kế:

```txt
deleted_by_parent/source flag
restore criteria
purge schedule
cleanup files/media
notification policy
```

## 6.15) Backend phải cản khách bằng phương án thay thế

Không chỉ nói “không làm được”. Nói bằng trade-off và đề xuất.

Mẫu phản biện:

```txt
Observation: Yêu cầu hiện tại là ...
Inference: Nếu làm vậy sẽ ...
Decision: Nên đổi sang ...
```

Ví dụ:

- Observation: Khách muốn xóa user là xóa sạch workspace.
  Inference: Workspace có member khác, xóa sạch làm mất dữ liệu team.
  Decision: Transfer owner hoặc set membership inactive, chỉ purge workspace cá nhân sau grace period.

- Observation: Khách muốn frontend load toàn bộ works để lọc.
  Inference: Dễ N+1, timeout, bill DB cao, leak hidden/private data.
  Decision: Backend expose filter allowlist, scope quyền, paginate, index.

- Observation: Khách muốn mọi bảng đều SoftDelete.
  Inference: Restore mơ hồ, query phình, purge phức tạp.
  Decision: Chỉ root business dùng SoftDelete; pivot/log/file xử lý theo lifecycle riêng.

- Observation: Khách muốn OrderItem lấy tên/giá từ Product live.
  Inference: Đổi giá sản phẩm làm sai lịch sử đơn hàng.
  Decision: Lưu snapshot `product_name/product_price` vào `order_items`.

## 6.16) Business checklist trước khi chốt thiết kế

1. Entity này là root hay child của aggregate nào?
2. Có thật sự cần container riêng không?
3. Dữ liệu nào phải snapshot để bảo toàn lịch sử?
4. Delete là hide, soft delete, inactive, detach, transfer, anonymize hay force delete?
5. Restore có khôi phục nhầm dữ liệu user tự xóa không?
6. List/search có thể scale lên 10x traffic không?
7. Transformer có thể gây N+1 không?
8. Side effect có chạy sau commit không?
9. Notification/realtime có gửi đúng người theo private/hide không?
10. Có yêu cầu nào của khách cần phản biện vì gây mất dữ liệu, leak quyền hoặc tốn chi phí không?
