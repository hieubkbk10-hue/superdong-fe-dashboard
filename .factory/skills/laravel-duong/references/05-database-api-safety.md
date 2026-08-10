# 5) Database / API Safety

File này không lặp migration syntax ở `01/02`. Chỉ ghi rule an toàn dữ liệu/API.

## 5.1) List API phải có giới hạn

Rule:

- Endpoint list mặc định dùng `paginate()`.
- `limit` từ query phải validate `integer|min:1|max:<cap>`.
- Batch input như `ids`, `emails`, `members`, `files`, `persons` phải có `max`.
- Tránh `all()`, `get()` cho API user-facing nếu chưa hard-cap hoặc scope nhỏ.
- Job xử lý nhiều dòng phải dùng `chunk()` hoặc `chunkById()`.

Checklist:

```txt
GET list -> addRequestCriteria -> push permission criteria -> paginate
POST batch -> validate array|min|max -> transaction -> per-item permission
Job purge/import -> chunkById -> idempotent
```

## 5.2) Query phải có scope quyền

`Rule::exists()` chỉ chứng minh record tồn tại, không chứng minh user có quyền.

Rule:

- Mọi `id`, `ids`, `workspace_id`, `board_id`, `project_id`, `work_id` phải check ownership/member.
- Dùng `canView()`, `canEdit()`, `canDelete()` trước mutation.
- List query phải scope theo workspace/board/project và member/private/public/hide.
- Hidden data chỉ cho owner/admin đúng cấp.
- Không tin client gửi `user_id`, `requester_id`, `role`, `active`.

## 5.3) Field search phải an toàn

Rule:

- `$fieldSearchable` chỉ chứa field thật, cần expose cho frontend.
- Field search/sort hay dùng phải có index hoặc query plan chấp nhận được.
- Filter bảo mật không để trong query param, phải push criteria ở backend.
- Nếu repository field lệch schema, sửa trước khi expose filter mới.

Khi thêm filter:

```txt
Request validate query
-> Repository fieldSearchable
-> DB index nếu filter/sort thường xuyên
-> Task push criteria quyền
-> route @apiQuery docs
```

## 5.4) Index và schema

Rule:

- Foreign key, frequent `where`, `orderBy`, compound filter/sort cần index.
- Pivot table nên có primary/unique composite.
- JSON field chỉ phù hợp khi không cần filter sâu thường xuyên.
- Nếu query JSON path dài hạn, cân nhắc generated column/index hoặc tách bảng.
- Soft-delete table cần nghĩ tới query `whereNull(deleted_at)` khi data lớn.

Không làm:

- Thêm endpoint search trên cột chưa có index nếu data có thể lớn.
- Dùng JSON để thay bảng quan hệ khi cần query/report độc lập.
- Đổi FK delete behavior mà không kiểm tra soft-delete listener.

## 5.5) JSON payload phải có shape

Các field như `statuses`, `tags`, `config`, `checklist`, `schedule`, `points`, `files` là JSON/dynamic data.

Rule:

- Request phải validate key allowed, type, max length, max item count.
- Model phải có `$casts` tương ứng.
- Task phải normalize theo domain config, không lưu nguyên payload nếu có rule nghiệp vụ.
- Không copy typo validation legacy.
- Content người dùng nhập trực tiếp nên có `max` nếu lưu DB/text hoặc gửi realtime.

## 5.6) ID contract phải rõ

Repo thường:

- Top-level response `id` dùng hash.
- Một số foreign key trong response/realtime còn raw.

Rule:

- Không tự đổi raw id sang hash hoặc ngược lại nếu task không yêu cầu.
- Endpoint mới nên quyết định rõ public API dùng hash hay raw.
- URL id hashed thì Request phải có `$decode` + `$urlParameters`.
- Body id hashed thì thêm field vào `$decode`.
- Không trả `real_id` trừ khi qua `ifAdmin()`.

## 5.7) Transformer không gây N+1

Rule:

- Không query trong Transformer khi transform collection lớn.
- Ưu tiên eager load, `withCount`, `withExists`, aggregate query.
- Permission flags trong Transformer có thể gọi query ngầm, phải đọc Model method.
- Include nặng phải opt-in qua `include`, không default bừa.

Nếu thấy trong Transformer:

```txt
relation()->pluck()
relation()->count()
exists()
```

phải kiểm tra endpoint list có preload/aggregate chưa.

## 5.8) Soft delete, restore, purge

Rule:

- Soft delete parent cần flag nguyên nhân: `deleted_by_workspace`, `deleted_by_board`, `deleted_by_project`, `deleted_by_parent`, `deleted_by_user`.
- Restore chỉ restore child bị xóa bởi đúng parent action.
- Force delete/purge phải chunk và cleanup file/media.
- Không dựa vào DB cascade cho soft delete.
- Khi remove member có dữ liệu, ưu tiên `active=false` hoặc transfer owner thay vì mất data.

## 5.9) Side effect sau commit

Rule:

- Mail, notification, realtime, FCM, delete file nên chạy sau commit nếu phụ thuộc DB.
- Nếu event gửi trong transaction, kiểm tra rollback risk.
- Realtime payload phải ổn định shape và không leak secret/internal fields.
- Notification data denormalized phải update/delete khi entity đổi tên hoặc bị xóa.

## 5.10) Red flags cần soi

- `paginate($limit)` nhận limit trực tiếp từ request mà không cap.
- Batch `array` không có `max`.
- `get()` trong API list hoặc Transformer collection.
- `$fieldSearchable` chứa field không tồn tại.
- Restore/delete không check quyền.
- Query JSON path trên column text/json không index.
- Dispatch realtime/mail trước `DB::commit()`.

## 5.11) N+1 specific trong repo

Các hotspot đã thấy:

- `CommentTransformer` gọi `$comment->likes()->pluck()` và `$comment->viewers()->pluck()`.
- `ProjectTransformer::includeStatistic()` count Work theo từng status và thêm min/max deadline.
- `WorkspaceTransformer::includeStatistic()` gọi `$workspace->boards()->count()`.
- `Work::canEdit()` gọi `$this->userIds()->where(...)->exists()` nếu relation/pivot chưa load.
- Realtime `CreateWorkRealtime` transform `$work` theo từng user, nếu thiếu relation sẽ nhân query theo số user.

Rule an toàn:

```txt
List endpoint -> preload relation/count/exists trong Task.
Transformer -> đọc relation đã load trước, fallback query chỉ cho detail/single.
Statistic -> gom aggregate ở Task nếu trả cho nhiều item.
Permission flag -> batch/preload pivot theo auth user nếu collection lớn.
Realtime nhiều recipients -> preload trước dispatch hoặc build payload dùng relation đã load.
```

Không chấp nhận:

- Thêm include default mà bên trong count/query per item.
- Gọi `canEdit()` hàng loạt khi model chưa load parent chain/pivot.
- Dùng `get()` để frontend tự group/count/filter.

## 5.12) SoftDelete decision matrix

| Case                                                     | Nên làm                                           |
| -------------------------------------------------------- | ------------------------------------------------- |
| Business root cần restore, recycle bin, purge sau X ngày | SoftDelete                                        |
| Parent delete phải kéo child rồi restore đúng nhóm       | SoftDelete + `deleted_by_*`                       |
| Pivot membership có dữ liệu user/team cần giữ            | `active=false` hoặc soft delete nếu có restore rõ |
| Like/viewer/temp pivot không có lifecycle riêng          | Hard delete/cascade                               |
| Log/history/audit                                        | Thường không soft delete, vì bản thân là lịch sử  |
| File/media phụ thuộc parent                              | Delete khi force delete, soft delete parent trước |
| Legal/privacy yêu cầu xóa vĩnh viễn                      | Force delete/anonymize theo rule rõ               |

Repo evidence:

- `Workspace/Board/Project/Work/User` có SoftDelete.
- `Comment`, `WorkFile`, `WorkLog`, `WorkHistory`, pivot tables không SoftDelete.
- `repository.force_delete = 7` và `ConsoleKernel` có purge jobs theo ngày.

Rule:

- SoftDelete không thay thế permission.
- SoftDelete không kích hoạt DB cascade như hard delete.
- Restore phải check quyền và chỉ restore child có flag đúng nguyên nhân.
- Force delete phải cleanup file/media và notification snapshot nếu business cần.

## 5.13) Snapshot để chống mất dữ liệu khi FK bị xóa/đổi

FK là quan hệ hiện tại, snapshot là dữ liệu lịch sử.

Nên snapshot khi:

- Giá/tên/trạng thái tại thời điểm phát sinh có ý nghĩa pháp lý/nghiệp vụ.
- Record gốc có thể đổi tên, đổi giá, bị soft/hard delete.
- Màn hình lịch sử cần render không phụ thuộc join.

Ví dụ:

```txt
orders
-> receiver_name, receiver_phone, receiver_address
-> sender_name, sender_phone, sender_address

order_items
-> product_id
-> product_name, product_sku, product_price, product_unit
-> quantity, discount, tax, total
```

Rule:

- Không chỉ lưu `product_id` rồi lấy tên/giá hiện tại.
- Không để `nullOnDelete` làm mất khả năng đọc lịch sử.
- Nếu snapshot nằm trong JSON, validate shape và giới hạn size.
- Nếu snapshot cần search/report, dùng column riêng thay vì JSON.

## 5.14) Data preservation khi xóa parent

Trước khi chọn `cascadeOnDelete()`, `nullOnDelete()`, SoftDelete, hoặc detach, trả lời:

1. Child có còn ý nghĩa khi parent mất không?
2. Có cần restore parent và child không?
3. User có tự xóa child trước đó không?
4. Có audit/order/history cần giữ không?
5. Có file/media cần cleanup khi force delete không?

Decision:

- `cascadeOnDelete()`: child vô nghĩa nếu parent hard delete, ví dụ pivot/like/file.
- `nullOnDelete()`: relation phụ, record vẫn có nghĩa, ví dụ invite creator nullable.
- SoftDelete + flag: root/child business cần restore đúng nguyên nhân.
- Snapshot fields: lịch sử cần render dù FK mất.
- Inactive/transfer: membership/owner có dữ liệu team.

## 5.15) Backend cost guardrails

Mỗi list/search mới phải có:

- Pagination/limit cap.
- DB filter, không filter PHP collection.
- Index cho filter/sort có traffic.
- `$fieldSearchable` allowlist.
- Query count được soi ở Transformer/includes.
- Batch array có `max`.

Nếu product muốn “load hết cho nhanh frontend làm”, backend phải phản biện vì đây là rủi ro bandwidth, timeout, N+1 và bill cloud.
