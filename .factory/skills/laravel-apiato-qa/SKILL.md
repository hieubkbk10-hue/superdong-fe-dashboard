---
name: laravel-apiato-qa
version: 1.0.0
description: |
  Use when the user asks for QA, code review, review before commit, PR review, audit, quality gate, bug/security/performance checks, or validation of Laravel 9 Apiato/Porto changes in this repository.
---

# Laravel Apiato QA

Skill này dùng để QA/code review repo Laravel 9, Apiato, Porto này theo chuẩn công ty và “vibe” dự án.

## Khi nào dùng

Dùng khi user nói:

- QA code.
- Review trước commit.
- Check PR/diff.
- Audit bug/security/performance.
- Kiểm tra endpoint Apiato.
- Validate feature Laravel/Apiato.

## Nguồn bắt buộc đọc

1. `AGENTS.md`.
2. `.factory/standards/quy_chuan_code_cong_ty.md`.
3. `.factory/standards/quy_chuan_dat_ten_laravel_apiato.md`.
4. `.factory/skills/laravel-duong/SKILL.md`.
5. `.factory/skills/laravel-duong/references/*.md`.
6. Checklist chi tiết: [references/checklist.md](references/checklist.md).

Không đọc/in `.env`, key, token, private secret.

## Quy trình QA

### 1. Xác định phạm vi

- Nếu user chỉ định file/diff, review đúng phạm vi đó.
- Nếu review trước commit, đọc `git status`, `git diff`, `git diff --cached`.
- Nếu review feature, trace đủ flow:

```txt
Route -> Request -> Controller -> Action -> Task -> Repository/Model -> Transformer
-> Event/Listener/Job/Realtime
```

### 2. Audit theo tầng

- Route: có `@api`, đúng middleware, đúng method/URI.
- Request: `$access`, `$decode`, `$urlParameters`, validation caps, authorization.
- Controller: mỏng, không query, không business logic.
- Action: dùng `sanitizeInput()`, không `$request->all()`.
- Task: transaction, domain permission, Repository, relation sync, log/history, side effect order.
- Repository: `$fieldSearchable` đúng schema, filter ở DB, paginate.
- Model: Ship Parent, fillable/casts/relation, `canView/canEdit/canDelete`, event side effects.
- Transformer: hash id, no secrets, includes an toàn, không N+1.
- Migration: FK/index/soft delete/json cast/delete behavior.
- Event/Listener/Job: after commit nếu cần, chunk, idempotent, cleanup.
- Aggregate/Container: model chính có container riêng, child/pivot/log/snapshot nằm đúng aggregate.
- Snapshot/Data preservation: dữ liệu lịch sử không phụ thuộc FK live.
- Business pushback: yêu cầu gây mất dữ liệu, leak quyền, N+1 hoặc bill DB cao phải được phản biện.

### 3. Ưu tiên phát hiện lỗi

Tìm lỗi high-confidence trước:

1. Security/IDOR/authorization leak.
2. Data loss, wrong delete/restore, rollback fail.
3. N+1, unbounded list, missing index for new query.
4. Wrong layer, raw Laravel parent, raw response.
5. Hash ID contract mismatch.
6. Realtime/notification sent to wrong users.
7. Validation typo, missing cap, unsafe JSON shape.
8. Side effect before commit causing ghost event/mail.
9. Aggregate split sai, tạo container cho pivot/log không có lifecycle riêng.
10. Thiếu snapshot cho order/payment/history khiến đổi/xóa record gốc làm sai dữ liệu cũ.

### 4. Output format

Trả lời ngắn bằng tiếng Việt, tách rõ:

```txt
Observation
- Evidence: file:line

Inference
- Vì sao đây là bug/risk.

Decision
- Fix đề xuất, ưu tiên thay đổi nhỏ.
```

Nếu có findings, dùng format:

```txt
## Findings

### [High] Tiêu đề lỗi
- Evidence: `path:line`
- Risk: ...
- Fix: ...

## Không thấy lỗi blocking
- Nêu phạm vi đã kiểm.

## Validators
- Lệnh đã chạy hoặc lý do chưa chạy.
```

Không báo issue mơ hồ. Nếu chỉ là style nhỏ, ghi `Low` hoặc bỏ qua.

## Repo-specific decisions

- Hash response id: repo ưu tiên `$model->getHashedKey()`, không tự đổi sang `$this->encode()` nếu file hiện tại không dùng.
- Authorization: Request `$access` chưa đủ, Task/Model phải check domain permission bằng `canView/canEdit/canDelete`.
- Transaction: repo hiện dùng transaction ở Task cho multi-step writes, match pattern hiện tại.
- Storage/CDN: code nghiệp vụ nên dùng helper `cdn_url()`, `cdn_upload()`, `cdn_delete()`, `storage_url()`.
- Realtime event có thể gửi ngay trong constructor, luôn audit thứ tự với `DB::commit()`.
- `.private.php` không đủ để kết luận endpoint có auth, phải đọc route middleware.
- “1 model = 1 container” hiểu là model chính có nghiệp vụ độc lập. `WorkFile`, `WorkLog`, `WorkHistory`, pivot, like/viewer nằm trong aggregate cha nếu không có lifecycle riêng.
- SoftDelete chỉ dùng khi có restore/purge semantics rõ. Nếu parent soft delete child, phải có `deleted_by_*` để restore đúng nguyên nhân.
- Snapshot là bắt buộc cho dữ liệu lịch sử như đơn hàng, payment, shipment, notification/audit khi record gốc có thể đổi hoặc bị xóa.
- N+1 hotspot repo: `CommentTransformer` likes/viewers pluck, `ProjectTransformer::includeStatistic()` count theo status, permission method query trong collection, realtime transform theo nhiều user.
- Backend QA phải biết phản biện: không load all cho frontend lọc, không hard delete dữ liệu team, không chỉ lưu FK cho dữ liệu lịch sử.

## Khi được yêu cầu fix

1. Report lỗi chính nếu cần.
2. Sửa đúng file liên quan, tránh refactor lan rộng.
3. Chạy validator phù hợp:

```txt
composer validate --strict
vendor/bin/php-cs-fixer fix --config=php_cs.dist.php --dry-run --diff
vendor/bin/psalm --config=psalm.dist.xml
vendor/bin/phpunit
```

Nếu validator fail do môi trường hoặc warning có sẵn, ghi rõ lệnh và lỗi chính.
