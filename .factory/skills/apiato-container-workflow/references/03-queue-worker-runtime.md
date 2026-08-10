# Queue, Job, Worker và Scheduler

Module này `(optional)` nhưng trở thành bắt buộc khi feature có background, delayed, slow hoặc external work.

## 1. Quyết định boundary

Phân loại trước:

| Loại                                         | Chạy ở đâu                     |
| -------------------------------------------- | ------------------------------ |
| Core write phải nhất quán ngay               | Action/Task trong transaction  |
| Side effect có thể eventual consistency      | Queued Listener/Job sau commit |
| External I/O, mail, push, webhook, thumbnail | Queue riêng phù hợp            |
| Recurrence/purge/import định kỳ              | Scheduler dispatch Job         |

Không đưa core write bắt buộc vào queued Listener sau khi endpoint đã trả success.

## 2. Thứ tự triển khai

1. Chốt trigger, payload và expected result.
2. Chốt queue connection production.
3. Kiểm tra `jobs` và `failed_jobs` migrations nếu dùng database queue.
4. Tạo Job extends Ship Parent Job.
5. Job nhận scalar ID/UUID hoặc immutable DTO nhỏ.
6. Chọn missing-model policy.
7. Tạo Task/Action mà Job gọi.
8. Thiết kế idempotency.
9. Khai báo queue routing.
10. Khai báo retries/failure policy.
11. Dispatch after commit.
12. Tạo Listener/Notification nếu flow dùng Event.
13. Đăng ký EventServiceProvider.
14. Viết tests.
15. Cấu hình worker và deploy runbook.

## 3. Job contract

Mỗi Job phải chốt:

```txt
connection
queue
payload
tries
backoff
timeout
retryUntil/maxExceptions nếu cần
idempotency strategy
missing model strategy
failed(Throwable) behavior
observability
```

Rules:

- `timeout < retry_after`.
- Không serialize Request, service, closure hoặc relation graph lớn.
- Nếu truyền Model, hiểu `SerializesModels` sẽ reload state tại thời điểm worker chạy.
- Không catch rồi nuốt exception cần retry.
- `failed()` chỉ log/alert/compensate best effort, không che lỗi gốc.
- External API cần timeout, retry policy và rate limit.

## 4. Idempotency và concurrency

Chọn ít nhất một cơ chế phù hợp:

- unique DB constraint;
- idempotency/dedup key;
- upsert;
- status transition guard;
- `ShouldBeUnique`;
- `WithoutOverlapping`;
- owner/resource lock;
- kiểm tra output file đã tồn tại;
- event ID cho webhook/realtime.

Test Job chạy hai lần.

## 5. Transaction và dispatch

```txt
Action/Task transaction
-> core writes
-> commit
-> Event/Job/Notification afterCommit
-> worker reload data
-> idempotent side effect
```

Không:

- external HTTP trong Event constructor;
- dispatch file deletion trước commit;
- dựa vào `QUEUE_CONNECTION=sync` để chứng minh async/delay;
- xóa file gốc khi chỉ riêng thumbnail Job dispatch thất bại.

## 6. Event, Listener và Provider

1. Event là data carrier.
2. Listener xử lý một reaction.
3. External Listener implements `ShouldQueue`.
4. Dùng `$afterCommit = true` khi phụ thuộc committed state.
5. Subscriber dùng `subscribe()` nếu gom reaction theo domain.
6. Đăng ký trong `EventServiceProvider`.
7. Đăng ký Event provider trong `MainServiceProvider`.
8. Kiểm tra:

```bash
php artisan event:list
```

## 7. Queue connection

Development có thể dùng `sync` để debug, nhưng không chứng minh:

- background execution;
- delay;
- serialization;
- retry;
- failed jobs;
- worker restart;
- after-commit behavior của backend async.

Production phải chốt database/Redis/SQS và cập nhật `.env.example`, không đọc/in `.env`.

## 8. Worker

Ví dụ command:

```bash
php artisan queue:work redis --queue=media,default --sleep=1 --tries=3 --timeout=120 --memory=256 --max-time=3600
```

Rules:

- Tách queue cho workload nặng: media, mail, notifications, realtime, maintenance.
- Queue ưu tiên đứng trước trong `--queue`.
- Worker chạy qua Supervisor/systemd/container orchestrator.
- `stopwaitsecs` lớn hơn Job timeout dài nhất.
- Restart worker sau deploy:

```bash
php artisan queue:restart
```

- Theo dõi queue depth, latency, retries và failed jobs.

Runbook:

```bash
php artisan queue:failed
php artisan queue:retry <id>
php artisan queue:forget <id>
php artisan queue:flush
```

Không chạy `queue:flush` nếu chưa có yêu cầu vận hành rõ ràng.

## 9. Scheduler

1. Scheduler chỉ dispatch hoặc điều phối batch nhỏ.
2. Job dài dùng `chunkById()`.
3. Dùng `withoutOverlapping()`.
4. Dùng `onOneServer()` khi nhiều scheduler node.
5. Recurring creation cần unique constraint/idempotency.
6. Server cron gọi:

```cron
* * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1
```

7. Worker phải chạy cho queue mà scheduler dispatch tới.

## 10. Tests

- `Queue::fake()` xác nhận Job/queue/delay.
- `Event::fake()`.
- `Notification::fake()`, `Mail::fake()`.
- `Http::fake()` cho external I/O.
- Unit test trực tiếp `handle()`.
- Test exception retryable được throw lại.
- Test `failed()`.
- Test idempotency bằng chạy hai lần.
- Test missing model.
- Test rollback không dispatch side effect.
- Integration test với backend không phải `sync` khi correctness phụ thuộc serialization/delay.

## 11. Deploy gate

```txt
queue connection configured
jobs/failed_jobs ready
timeout < retry_after
workers cover every queue
Supervisor/systemd enabled
scheduler cron enabled if used
event/config caches refreshed
queue:restart executed
failed-job monitoring available
rollback/runbook documented
```

## Red flags từ Dozy2-BE không được copy

- Queue mặc định `sync` nhưng dùng delayed Job.
- External realtime chạy trong Event constructor trước commit.
- Job không có tries/backoff/timeout/failed.
- Catch rồi nuốt exception nên không retry.
- Full Model/object graph payload không có missing-model policy.
- Scheduler không chống overlap/multi-node duplicates.
- Mọi workload dùng queue `default`.
- Purge transaction bao trùm nhiều chunks và dispatch xóa file trước commit.
