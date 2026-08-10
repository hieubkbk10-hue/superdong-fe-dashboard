# 4) Code Quality / Maintainability

File này không lặp cú pháp ở `01` hoặc layer ở `03`. Chỉ ghi rule để sửa code ít regression.

## 4.1) Nguyên tắc sửa code

- Sửa nhỏ, đúng scope, dễ rollback.
- Match pattern file gần nhất trước khi “chuẩn hóa”.
- Đọc đủ đường đi: Request, Action, Task, Model, Transformer, Event/Listener liên quan.
- Không refactor code lân cận nếu task không yêu cầu.
- Khi thấy bug copy-paste, sửa đúng điểm gây lỗi, không format lại cả file.

## 4.2) Transaction và exception

Task ghi nhiều bước phải có transaction:

```txt
beginTransaction
-> validate domain state
-> mutate model/relation/log/history
-> dispatch side effects có kiểm soát
-> commit
catch -> rollBack -> throw Ship exception đúng intent
```

Rule:

- `rollBack()` phải chạy trước `throw`.
- Create/Update/Delete Task nên throw đúng nhóm `CreateResourceFailedException`, `UpdateResourceFailedException`, `DeleteResourceFailedException`.
- Không nuốt lỗi core workflow.
- Chỉ swallow/log lỗi side effect không bắt buộc như realtime/notification, và phải biết lỗi đó không rollback nghiệp vụ.

## 4.3) Side effect phải rõ thứ tự

Side effect trong repo gồm:

- Realtime event.
- Notification/mail/FCM.
- Delete file job.
- Audit log/history.
- Cascade soft delete/restore listener.

Rule:

- Đừng mặc định Event là queued. Realtime event có thể gửi ngay trong constructor.
- Nếu side effect phụ thuộc DB đã commit, ưu tiên `afterCommit()` hoặc dispatch sau commit.
- Khi đổi create/update/delete, kiểm tra cả realtime event, notification listener và purge job.
- External side effect fail không nên làm hỏng core state nếu business không yêu cầu.

## 4.4) Audit log và history là behavior

Work domain có log/history quan trọng:

- Log field change: `from/to`, `type`, `name`, `user_id`.
- Log file add/delete.
- History marker theo ngày, ví dụ `today`.

Rule:

- Trước update lớn nên giữ `$origin = $model->toArray()`.
- Field nào tác động UI, điểm, deadline, status, visibility thì cân nhắc log.
- History unique theo ngày/action phải create/delete đồng bộ với source field.
- Không xóa log/history chỉ vì “dọn data” nếu đó là audit trail.

## 4.5) Config/default/helper

Ưu tiên nguồn có sẵn:

- `config('todoSection-*')` cho default list.
- Model method như `getConfig()`, `getStatuses()`, `isHidden()`.
- Helper domain như `parse_statuses()`, `has_include()`, `get_auth()`.

Rule:

- Không hardcode list/status/tag/review config nếu đã có config/model method.
- Helper global chỉ dùng cho logic thật sự dùng chung.
- Logic chỉ thuộc một Container thì để trong Model/Task của Container đó.

## 4.6) Tên phải nói ý đồ

Tên tốt trong repo:

```txt
canView / canEdit / canDelete
isHidden / getAdminIds / getMainWorkspace
actionHide / actionShow / actionDuplicate
CreateWorkRealtime / DeleteProjectEvent
```

Rule:

- Tránh tên chung như `handleData`, `process`, `CommonTask`.
- Tên Task/Action phải nói use case, không nói kỹ thuật.
- Tên boolean nên đọc như câu hỏi: `isHidden`, `allowReview`, `skipPagination`.

## 4.7) Giảm regression khi đổi domain chính

Khi đổi Workspace/Board/Project/Work/Comment, luôn kiểm tra:

1. Permission method ở Model.
2. List Task và criteria quyền.
3. Transformer permission flags.
4. Realtime event recipients.
5. Notification denormalized payload.
6. Soft delete/restore flags.
7. Sample/default data nếu liên quan onboarding.
8. Schedule/review/log/history nếu liên quan Work.

## 4.8) Cẩn trọng đã thấy trong repo

- Một số flow dispatch side effect trước `DB::commit()`.
- Có chỗ rollback đặt sau throw, unreachable.
- Có typo validation/config legacy, không copy tiếp.
- Có branch copy-paste gần giống nhau, phải kiểm tra biến dùng trong từng branch.
- Test suite mỏng, nên review diff kỹ và chạy validator phù hợp.

## 4.9) Maintain aggregate boundary

Không tách/gộp model theo cảm tính.

Rule:

- Một container nên có một model chính, nhưng được phép có nhiều model con thuộc aggregate.
- Model con phải có lý do nằm trong container cha: cùng lifecycle, cùng parent key, cùng quyền, không có API độc lập.
- Nếu model con bắt đầu có query/report/quyền/lifecycle riêng, đó là tín hiệu tách container.
- Không đẩy logic child vào Ship chỉ vì nhiều file cần gọi trong cùng container.

Red flags:

- Container mới chỉ chứa pivot/log/history không có endpoint.
- Task của container A ghi quá nhiều bảng của container B mà không qua event/action rõ.
- Transformer root phải join quá nhiều child chỉ để render list.

## 4.10) N+1 là lỗi maintainability, không chỉ performance

Khi review code list, coi các pattern sau là smell:

```txt
Transformer -> relation()->pluck()
Transformer -> relation()->count()
Transformer -> canEdit()/canDelete() gọi exists()
includeStatistic -> count() theo từng item/status
foreach -> Repository/Model query
Realtime -> transform trong vòng lặp user mà thiếu preload
```

Rule sửa:

- Nếu relation đã load, đọc từ collection: `$model->relation->pluck(...)`.
- Nếu cần count, dùng `withCount`.
- Nếu cần boolean tồn tại, dùng `withExists` hoặc preload pivot theo user.
- Nếu cần statistic nhiều status, gom bằng `groupBy status` ở Task.
- Nếu chỉ dùng ở detail, chuyển thành include opt-in.

Khi chưa sửa được trong scope nhỏ, ghi rõ risk và không copy pattern sang code mới.

## 4.11) Side effect phải idempotent

Listener/Job có thể chạy lại hoặc chạy sau commit. Vì vậy:

- Update denormalized notification phải chunk và update theo id/payload cụ thể.
- Delete force phải không lỗi nếu record đã được xóa ở lần chạy trước.
- Realtime có thể gửi trùng, frontend phải nhận event theo id.
- File cleanup nên gom URL và dispatch job, không xóa trực tiếp trong loop dài nếu không cần.

Không nên:

- Listener phụ thuộc biến `request()` nếu có thể chạy queue/console.
- Listener làm core state bắt buộc mà endpoint đã trả success trước khi chạy.
- Swallow exception cho core write.

## 4.12) Snapshot là contract lâu dài

Nếu thêm snapshot fields, đặt tên tường minh:

```txt
product_id
product_name
product_sku
product_price
receiver_name
receiver_phone
receiver_address
sender_name
sender_phone
```

Rule:

- Snapshot field không phải duplicate vô nghĩa, nó là sự thật tại thời điểm phát sinh.
- Không đặt tên mơ hồ như `data`, `info` nếu field có ý nghĩa nghiệp vụ rõ.
- Nếu dùng JSON snapshot, validate shape và version nếu có khả năng đổi schema.
- Không xóa snapshot khi entity gốc bị xóa, trừ khi vi phạm privacy/legal requirement đã được nêu rõ.

## 4.13) Backend phải biết nói “không” bằng lý do kỹ thuật và nghiệp vụ

Khi khách yêu cầu hướng rủi ro, phản biện theo format:

```txt
Observation: yêu cầu hiện tại sẽ tạo rủi ro gì.
Inference: rủi ro đó ảnh hưởng data/API/chi phí/vận hành thế nào.
Decision: đề xuất hướng nhỏ hơn, an toàn hơn, vẫn đạt mục tiêu.
```

Ví dụ:

- Không nhận `sort` từ client nếu backend tự tính theo scope được.
- Không detach member có dữ liệu nếu cần audit, dùng `active=false`.
- Không hard delete record business quan trọng ngay lập tức, dùng SoftDelete + purge.
- Không để frontend lọc toàn bộ dữ liệu, thêm filter DB + pagination.
