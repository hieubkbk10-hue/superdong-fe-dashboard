# 3) Architecture / Layer Flow

File này không lặp naming ở `02`. Chỉ ghi trách nhiệm layer và flow thật trong repo.

## 3.1) Mental model

```txt
Route -> Request -> Controller -> Action -> Task -> Repository/Model -> Transformer
                                -> Event/Listener/Job/Realtime side effects
```

Thực tế repo:

- `Request` giữ contract đầu vào, không giữ toàn bộ domain permission.
- `Action` thường mỏng: sanitize/enrich input rồi gọi Task.
- `Task` là nơi chính của use case: transaction, permission, mutation, sync relation, log, dispatch.
- `Model` không chỉ là data object: có relation, cast, permission, lifecycle event, notification helper.
- `Transformer` là response contract nhưng đôi lúc đọc `request()` và gọi domain method.
- `Event` có 2 loại: domain event cho listener, realtime event gửi side effect ngay trong constructor.

## 3.2) Layer boundary

| Layer        | Được làm                                          | Không làm                                    |
| ------------ | ------------------------------------------------- | -------------------------------------------- |
| Route        | URI, HTTP verb, middleware, `@api` docs           | business/query                               |
| Request      | validate, authorize access, decode URL id         | ownership sâu                                |
| Controller   | nhận Request, gọi Action, trả response            | orchestration                                |
| Action       | `sanitizeInput()`, gán field server-owned         | query/mutate nặng                            |
| Task         | use case, transaction, repository, relation sync  | nhận Request object                          |
| Repository   | query surface, criteria, pagination               | business rule ẩn                             |
| Model        | relation, cast, permission, lifecycle domain hook | gọi HTTP/request phức tạp                    |
| Transformer  | public JSON shape, include, permission flags      | query nặng trong collection                  |
| Listener/Job | side effect, cascade, async cleanup               | core write bắt buộc nếu cần consistency ngay |

## 3.3) Write flow chuẩn

```txt
Request validate
-> Action whitelist payload
-> Task begin transaction
-> load parent by Repository
-> check canView/canEdit/canDelete
-> normalize business data
-> create/update/delete
-> sync pivot/files/log/history
-> dispatch side effect
-> commit
-> Transformer response
```

Rule:

- Permission thật nằm ở Task + Model method.
- Nếu ghi nhiều bảng, không tách rời transaction.
- Nếu đổi visible data, nghĩ tới realtime + notification + log/history.
- Nếu dispatch trước commit, audit risk rollback nhưng event đã bắn.

## 3.4) List flow chuẩn

```txt
Action lấy filter an toàn
-> Task addRequestCriteria()
-> Repository parse query theo fieldSearchable
-> Task push criteria quyền/scope
-> eager load include cần thiết
-> paginate()
-> Transformer
```

Rule:

- Public query filter chỉ qua `$fieldSearchable`.
- Quyền và scope backend luôn bằng `pushCriteria()`.
- `include`, `hierarchical`, `hide`, `follow`, `review` có thể đổi query shape, phải đọc Task.
- Không để client tự quyết scope dữ liệu chỉ bằng query string.

## 3.5) Delete / restore flow

```txt
Task check canDelete/canEdit
-> soft delete parent
-> model event dispatch domain event
-> listener soft delete child + set deleted_by_* flag
-> realtime/file cleanup/job nếu cần
```

Rule:

- Soft delete parent không đồng nghĩa FK cascade chạy.
- Cascade mềm nằm ở Event/Listener.
- Restore phải dựa vào `deleted_by_*` để không khôi phục nhầm dữ liệu user tự xóa.
- Force delete/purge phải chunk và cleanup files.

## 3.6) Realtime flow

```txt
Task/Model dispatch RealtimeEvent
-> event xác định recipients
-> transform payload theo từng user nếu cần
-> Realtime::send(room, event, data)
```

Rule:

- Public board: gửi active users trong workspace.
- Private board: gửi active board users.
- Hidden data: thường chỉ gửi admin/owner ids.
- Realtime event trong repo không luôn là DTO thuần, có thể query và gửi ngay.

## 3.7) Khi thêm feature

1. Xác định domain owner: Workspace, Board, Project, Work, Comment, Invite hay AppSection.
2. Vẽ parent chain và quyền cần kiểm.
3. Tìm endpoint tương tự trong cùng Container.
4. Đi theo flow hiện có, không nhảy thẳng Controller -> Model.
5. Nếu cần side effect, chọn Event/Listener/Job thay vì nhét vào Controller.
6. Nếu response đổi, update Transformer và route `@api` docs.
7. Nếu query list đổi, update Repository + Task criteria, không chỉ thêm request param.

## 3.8) Aggregate flow

Thiết kế aggregate trước khi tạo file:

```txt
Root entity
-> child entities sống chết theo root
-> pivot/membership
-> log/history/snapshot
-> side effects
```

Rule:

- Root entity có container riêng khi có API, quyền, trạng thái, owner, lifecycle riêng.
- Child entity nằm trong container root nếu chỉ phục vụ root.
- Pivot có nghiệp vụ thì tạo custom Pivot model, nhưng vẫn nằm cùng container với aggregate chủ quản.
- Log/history không tách container nếu chỉ là audit của root.

Ví dụ từ repo:

```txt
Work container
-> Work
-> WorkFile
-> WorkLog
-> WorkHistory
-> WorkReview / WorkReviewItem
-> WorkUser / WorkViewer / WorkFollower
```

Decision khi gặp yêu cầu “thêm model mới”:

1. Hỏi model này có endpoint riêng không.
2. Hỏi có quyền/lifecycle riêng không.
3. Hỏi có cần query/report độc lập không.
4. Nếu không, đặt dưới aggregate cha.
5. Nếu có, tạo container riêng và event/listener để đồng bộ với parent.

## 3.9) Event/Listener flow chuẩn

Domain event trong repo thường đi từ model event hoặc Task:

```txt
Task/model state changed
-> Event DTO
-> Listener subscriber
-> Repository builder/chunk
-> update denormalized data/cascade/delete files/realtime/notification
```

Boilerplate cần đủ:

```txt
Events/{Update|Delete|Restore}{Model}Event.php
Listeners/{UpstreamDomain}Listener.php
Providers/EventServiceProvider.php
Providers/MainServiceProvider.php
```

Rule:

- Event không nên chứa business query nặng, trừ nhóm `*Realtime` hiện có là convention đặc thù.
- Listener phải idempotent nếu queued hoặc có thể chạy lại.
- Listener cascade soft delete/restore phải dùng `deleted_by_*`.
- Listener cleanup lớn phải chunk.
- Notification realtime listener dùng `ShouldQueue` và `afterCommit`.

## 3.10) N+1 flow cần audit ở 3 chỗ

N+1 không chỉ nằm trong Task. Phải audit:

```txt
Task query shape
-> Model permission/domain method
-> Transformer/include/statistic
```

Checklist:

- Task list có `with()` đủ relation mà Transformer/permission dùng chưa.
- Model global scope có làm endpoint nhẹ bị nặng quá không, nếu có dùng `withoutGlobalScope('withDefault')`.
- Transformer có `relation()->pluck()`, `count()`, `exists()` không.
- Include statistic có chạy count theo từng item không.
- Realtime event transform nhiều user có query lại cùng payload không.

Decision:

- Dữ liệu cần per item và hiển thị trong list: preload bằng `with`, `withCount`, `withExists`.
- Dữ liệu aggregate lớn: tính ở Task/query riêng, không để Transformer tự count.
- Dữ liệu chỉ cần ở detail: đưa vào `include` opt-in, không default.

## 3.11) Snapshot flow

Khi nghiệp vụ cần lịch sử không đổi:

```txt
Create business record
-> lấy dữ liệu gốc đang đúng tại thời điểm đó
-> copy vào snapshot fields/payload
-> không phụ thuộc join để render lịch sử
```

Áp dụng mạnh cho:

- Order/OrderItem.
- Payment/refund.
- Notification.
- WorkLog/History.
- Shipment/người nhận/người gửi.
- Audit trail.

Rule:

- FK dùng để trace entity hiện tại, snapshot dùng để giữ sự thật lịch sử.
- Không update snapshot cũ nếu nghiệp vụ hỏi “lúc đó là gì”.
- Có thể update denormalized notification nếu UI muốn tên mới, nhưng phải là decision có chủ đích.

## 3.12) Backend phản biện yêu cầu trước khi flow code

Trước khi code, backend phải cản các yêu cầu gây mất dữ liệu hoặc scale kém:

```txt
Yêu cầu của khách
-> xác định data lifecycle
-> xác định ai được xem/sửa/xóa
-> xác định dữ liệu nào phải giữ lịch sử
-> xác định query list và traffic
-> đề xuất hướng an toàn hơn nếu yêu cầu ban đầu rủi ro
```

Ví dụ phản biện:

- “Xóa user thì xóa hết workspace” có thể mất dữ liệu team, nên cân nhắc transfer owner hoặc inactive membership.
- “OrderItem chỉ cần product_id” sai nếu sau này product đổi giá/tên, nên snapshot `product_name/product_price`.
- “Trả tất cả works để frontend tự lọc” sai vì bandwidth/N+1, phải filter/paginate ở DB.
- “Mọi bảng đều SoftDelete” sai nếu không có restore semantics.
