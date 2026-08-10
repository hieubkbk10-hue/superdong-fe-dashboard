# Laravel Apiato QA Checklist

Checklist này dùng cho QA/code review repo Laravel 9, Apiato, Porto này.

## 1. Critical

- [ ] Class đúng Ship Parent: Model, Controller, Request, Action, Task, Repository, Transformer, Event, Listener, Job.
- [ ] API Request không dùng raw `Illuminate\Http\Request`.
- [ ] Controller mỏng: Request -> một Action -> response/Transformer.
- [ ] Không query DB hoặc viết business logic trong Controller/Route.
- [ ] Action dùng `$request->sanitizeInput([...])`, không `$request->all()`.
- [ ] Task ghi nhiều bước có transaction và `rollBack()` trước khi throw.
- [ ] Mọi mutation theo `id/ids` có `canView/canEdit/canDelete` hoặc scope quyền tương đương.
- [ ] Không có IDOR: `Rule::exists()` không thay cho ownership check.

## 2. Porto flow

- [ ] Route có `@api` block nếu là API route.
- [ ] Route middleware khớp visibility, không đoán theo `.private.php`.
- [ ] Request có `$access`, `$decode`, `$urlParameters` khi cần.
- [ ] Update Request cho partial update không vô tình require field không đổi.
- [ ] Action chỉ normalize/enrich input và gọi Task.
- [ ] Task không nhận Request object.
- [ ] Repository xử lý data access/query surface.
- [ ] Transformer là public response contract.

## 3. Database và performance

- [ ] List API dùng `paginate()` hoặc limit an toàn.
- [ ] Query filter/sort chạy ở DB, không fetch all rồi filter collection.
- [ ] `$fieldSearchable` đúng field thật và chỉ expose field an toàn.
- [ ] Filter/sort mới có index phù hợp.
- [ ] FK, pivot primary/unique, soft delete, cascade/null delete đúng nghiệp vụ.
- [ ] Không N+1 trong list/Transformer.
- [ ] Transformer không gọi query nặng trong collection.
- [ ] Transformer ưu tiên relation đã load, không `relation()->pluck/count/exists` per item nếu có thể preload.
- [ ] Include statistic nhiều item được gom aggregate ở Task/query, không count theo từng model/status trong Transformer.
- [ ] Permission flags trong Transformer không nhân query do `canEdit/canDelete` thiếu preload.
- [ ] Realtime transform theo nhiều user không nhân query do thiếu relation preload.
- [ ] Batch input có `max`.
- [ ] Job/purge/import dùng `chunk()` hoặc `chunkById()`.

## 4. Security, Hash ID, Response

- [ ] Incoming URL id hashed có `$decode = ['id']` và `$urlParameters = ['id']`.
- [ ] Body/query id hashed được thêm vào `$decode`.
- [ ] Response top-level id dùng `$model->getHashedKey()` theo repo.
- [ ] Không trả `real_id`, timestamps, internal IDs nếu không qua `ifAdmin()`.
- [ ] Không trả password, token, secret, social token, private key.
- [ ] Không `return response()->json($model)` cho API resource chính.
- [ ] Response qua Transformer hoặc JSON contract rõ cho endpoint đặc biệt.
- [ ] Validation cap string, URL, array, JSON shape.

## 5. Domain safety

- [ ] Workspace/Board/Project/Work/Comment đi đúng parent chain.
- [ ] Board `public/private`, `hide`, membership `active` được xét.
- [ ] Hidden data chỉ visible với owner/admin đúng cấp.
- [ ] Status/tag validate theo Board/Workspace config.
- [ ] Work done side effects đúng: `done`, `completed_at`, `priority`, `points`, notification nếu có.
- [ ] Review chỉ chạy khi board bật review và reviewer là board member.
- [ ] Work child, recurrence, today, sort giữ đúng invariant.
- [ ] Remove member có data thì inactive/transfer, không detach mất dấu vết.

## 6. Side effect và lifecycle

- [ ] Realtime recipients đúng public/private/hidden.
- [ ] Mail/notification/realtime/FCM chạy sau commit nếu phụ thuộc DB.
- [ ] Notification payload denormalized được update/delete khi entity đổi/xóa.
- [ ] Delete/restore dùng `deleted_by_*` flag đúng cấp.
- [ ] Force delete/purge cleanup file/media.
- [ ] Model event dùng `updateQuietly()`/`saveQuietly()` khi update nội bộ.
- [ ] Listener không chứa core write bắt buộc nếu cần consistency ngay.
- [ ] Event extends Ship Parent Event, Listener extends Ship Parent Listener.
- [ ] Listener dùng `subscribe()` và container `EventServiceProvider` register `$subscribe`.
- [ ] Container `MainServiceProvider` register `EventServiceProvider::class` khi thêm provider mới.
- [ ] Listener/Job slow hoặc external idempotent, queued nếu cần, có `afterCommit` khi phụ thuộc DB commit.
- [ ] Soft delete cascade dùng chunk và restore đúng child bị xóa bởi parent action, không restore nhầm child user tự xóa.

## 7. Storage/CDN

- [ ] Dùng `cdn_url()`, `cdn_upload()`, `cdn_delete()`, `storage_url()` trong code nghiệp vụ.
- [ ] Không dùng raw `Storage::disk('cdn')` ngoài helper/command đặc thù đã có lý do.
- [ ] Xóa file khi WorkFile, Comment, Review, User avatar bị force delete nếu có liên quan.

## 8. Exception và error

- [ ] Throw Ship/App exception đúng intent: create/update/delete/not found.
- [ ] Không expose SQL/raw exception cho client.
- [ ] Không swallow lỗi core workflow.
- [ ] Side effect fail được log hoặc được chấp nhận rõ ràng.

## 9. Known repo red flags cần soi

- [ ] `paginate($limit)` nhận trực tiếp từ query mà không cap.
- [ ] Restore task thiếu ownership check.
- [ ] `GetAllHistoriesWorksTask` hoặc list phụ thiếu scope quyền.
- [ ] `$fieldSearchable` lệch migration/schema.
- [ ] Validation typo như `pendding`.
- [ ] Side effect dispatch trước `DB::commit()`.
- [ ] `rollBack()` unreachable sau `throw`.
- [ ] Raw `Storage::disk('cdn')` trong code nghiệp vụ.
- [ ] `response()->json($model)` ở API resource chính.
- [ ] `CommentTransformer` style `likes()->pluck()`/`viewers()->pluck()` bị copy sang list mới.
- [ ] `includeStatistic()` count trong vòng lặp khi endpoint trả collection.
- [ ] Tạo container mới cho pivot/log/history không có business lifecycle riêng.
- [ ] Thêm SoftDelete cho bảng không có restore/purge semantics.
- [ ] Chỉ lưu FK cho dữ liệu lịch sử cần snapshot như OrderItem/Product/User address.
- [ ] Khách yêu cầu load all/hard delete/detach member nhưng code không phản biện rủi ro.

## 10. Aggregate, container, model

- [ ] Model chính có nghiệp vụ độc lập mới tạo container riêng.
- [ ] Child model sống chết theo root nằm trong container cha.
- [ ] Pivot có role/active/main/event dùng custom Pivot model, không nhất thiết tách container.
- [ ] Log/history/file/review item nằm đúng aggregate, không đẩy bừa vào Ship.
- [ ] Cross-container write dùng Action/Task/event/listener rõ, không query chéo âm thầm quá nhiều.
- [ ] Aggregate root có transaction khi create/update/delete ghi nhiều bảng.
- [ ] Delete/restore/force delete của root xử lý đủ child, file, notification/realtime, snapshot policy.

## 11. Snapshot và bảo toàn dữ liệu

- [ ] Dữ liệu lịch sử không phụ thuộc join live nếu record gốc có thể đổi/xóa.
- [ ] Order/OrderItem snapshot `product_name`, `product_sku`, `product_price`, discount/tax/total nếu có.
- [ ] Shipping/payment snapshot người gửi, người nhận, amount/currency/provider reference khi cần.
- [ ] Notification/audit payload có policy rõ: giữ snapshot cũ hay update denormalized khi entity đổi tên.
- [ ] JSON snapshot có validation shape, max size, và version nếu có thể đổi schema.
- [ ] Column snapshot riêng được dùng nếu cần filter/search/report.
- [ ] Không xóa snapshot/audit/log trừ khi có yêu cầu legal/privacy rõ.

## 12. Backend phản biện nghiệp vụ

- [ ] Nếu yêu cầu gây mất dữ liệu team, đề xuất transfer owner/inactive/soft delete grace period.
- [ ] Nếu yêu cầu gây N+1/bandwidth cao, đề xuất filter DB, pagination, index, aggregate query.
- [ ] Nếu yêu cầu hard delete business record, kiểm tra restore/audit/legal trước.
- [ ] Nếu yêu cầu mọi bảng SoftDelete, kiểm tra restore semantics và purge cost.
- [ ] Nếu yêu cầu chỉ lưu FK cho lịch sử, đề xuất snapshot fields.
- [ ] Nếu yêu cầu frontend tự lọc/sort/search toàn bộ data, backend phải scope quyền và cap query.
- [ ] Ghi finding theo Observation, Inference, Decision, không chỉ nói “không nên”.

## 13. Validator

Ưu tiên chạy theo scope:

```txt
composer validate --strict
vendor/bin/php-cs-fixer fix --config=php_cs.dist.php --dry-run --diff
vendor/bin/psalm --config=psalm.dist.xml
vendor/bin/phpunit
php artisan apiato:apidoc
```

Nếu chỉ sửa skill/docs, `git diff --check` là validator tối thiểu.
