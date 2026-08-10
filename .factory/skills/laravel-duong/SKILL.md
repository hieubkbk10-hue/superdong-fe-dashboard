---
name: laravel-duong
version: 1.2.0
description: |
  Use when writing, reviewing, refactoring, or explaining Laravel/APIato code in this repository, especially Authentication, Laravel Passport, OAuth2, login/logout, token lifecycle, syntax choices, conventions, request/action/task flow, repository criteria, transformers, and business thinking theo style sư phụ Dương.
---

# Laravel Dương

Skill này giữ “vibe code” của sư phụ Dương cho dự án Laravel/APIato này: viết code đúng cú pháp, đúng skeleton, ít magic string, dễ trace, dễ refactor, và có tư duy nghiệp vụ trước khi sửa code.

## Khi nào dùng skill này

Dùng skill này khi user yêu cầu:

- Viết hoặc sửa feature Laravel/APIato trong repo này.
- Review cú pháp, convention, model, migration, request, action, task, repository, transformer.
- Giải thích vì sao một cú pháp tốt hơn kiểu Laravel Docs cơ bản hoặc kiểu dev non.
- Tạo ghi chú học tập về chuẩn code của dự án.
- Phân tích nghiệp vụ trước khi thiết kế flow code.
- Viết hoặc review Authentication, Passport, proxy login/refresh, logout/revoke token, email verification, password reset hoặc Social Authentication theo convention repo.

## Nền tảng Apiato bắt buộc

**REQUIRED BACKGROUND:** Dùng skill `apiato` cho kiến thức chuẩn Apiato 11.x, Porto, Laravel Passport, OAuth grants, guards, token lifecycle và testing. Skill này chỉ giữ convention, pattern và tư duy đã quan sát trong repo theo style sư phụ Dương.

## 7 phần chính

### 1) Syntax / Cú pháp chuẩn dự án

Reference chính: [01-syntax-cu-phap.md](references/01-syntax-cu-phap.md)

Luôn ưu tiên:

- Method/class/object hơn magic string.
- Explicit mapping hơn framework tự đoán.
- Ship Parent class hơn raw Laravel class.
- Trong static method của Model, ưu tiên `static::` khi gọi Eloquent method kế thừa để giữ late static binding, trừ khi muốn khóa cứng class cụ thể.
- Request/Action/Task/Repository/Transformer đúng flow APIato.
- Validation phức tạp ưu tiên object rule: `Rule::exists()`/`Rule::unique()` cho DB, `Password::min()` chain cho mật khẩu.
- `cascadeOnDelete()` / `nullOnDelete()` hơn `onDelete('...')`.

### 2) Convention / Vibe Framework

Reference skeleton: [02-convention-vibe-framework.md](references/02-convention-vibe-framework.md)

Mục tiêu: giữ naming, folder structure, file naming, route naming, class naming, method naming và code formatting đồng bộ với repo.

### 3) Architecture / Layer Flow

Reference skeleton: [03-architecture-layer-flow.md](references/03-architecture-layer-flow.md)

Mục tiêu: giữ đúng trách nhiệm từng layer:

- Route chỉ khai báo endpoint.
- Request validate input và access.
- Controller mỏng.
- Action điều phối use case.
- Task xử lý business/database.
- Repository quản lý query/filter.
- Transformer quản lý output API.

### 4) Code Quality / Maintainability

Reference skeleton: [04-code-quality-maintainability.md](references/04-code-quality-maintainability.md)

Mục tiêu: code dễ đọc, dễ sửa, ít lỗi dây chuyền, có type rõ, transaction đúng, không lạm dụng shortcut.

### 5) Database / API Safety

Reference skeleton: [05-database-api-safety.md](references/05-database-api-safety.md)

Mục tiêu: migration, relation, validation, response API, performance và security phải an toàn khi đi lâu dài.

### 6) Business Thinking / Tư duy nghiệp vụ

Reference skeleton: [06-business-thinking.md](references/06-business-thinking.md)

Mục tiêu: trước khi code phải hiểu domain rule, vai trò người dùng, ownership, trạng thái, side effect, notification, realtime, edge case và rollback.

### 7) Authentication / Laravel Passport

Reference chuyên sâu: [07-authentication-passport.md](references/07-authentication-passport.md)

Mục tiêu:

- Giữ client credentials ở server bằng proxy login/refresh.
- Dùng một nguồn cấu hình cho login attributes và password policy.
- Phân biệt issue, refresh, current-device revoke và all-device revoke.
- Giữ OAuth integration sau Task/adapter và SocialAuth sau contract/provider strategy.
- Thiết kế response, callback allowlist, verification và forgot-password theo security boundary rõ ràng.
- Đặt tư duy actor, client, credential, eligibility, lifetime và revocation trước khi code.

## Cách làm khi được giao task

1. Đọc code hiện tại trước, không đoán convention.
2. Xác định task thuộc phần nào trong 7 phần trên.
3. Nếu liên quan cú pháp, đọc `01-syntax-cu-phap.md` trước.
4. Nếu liên quan Authentication/Passport, đọc `07-authentication-passport.md` và skill `apiato` trước.
5. Giữ đúng flow APIato của repo, không viết Laravel CRUD tự do.
6. Khi đề xuất code, giải thích ngắn vì sao cú pháp đó tốt hơn kiểu viết non.
7. Sau khi sửa file, chạy validator phù hợp theo repo.

## Model event / `booted()` policy của repo này

- Ưu tiên dùng Model event trong `booted()` cho các side effect gọn (như cleanup file, pivot, log) thay vì tạo Observer class riêng để đảm bảo tính đóng gói (co-location) và tránh phát sinh file rác.
- `booted()` chỉ dùng để đăng ký Eloquent model callbacks/global scopes, không phải nơi chạy use case chính mỗi lần gọi model.
- Chỉ đặt callback trong model khi side effect phải áp dụng cho mọi lifecycle path của entity, ví dụ cascade soft delete/restore, cleanup file/pivot/log, field suy ra khi status đổi, hoặc notify nhỏ gắn chặt với create/delete.
- Không đặt logic cần context request, quyền endpoint, transaction workflow lớn, hoặc chỉ đúng cho một API cụ thể vào model event. Các logic đó thuộc Action/Task.
- Laravel tự fire callbacks như `created`, `updated`, `deleted`, `restored` khi thao tác qua Eloquent. Custom domain events của repo, ví dụ `DeleteUserEvent`, `UpdateBoardEvent`, vẫn phải dispatch thủ công trong callback hoặc Task, trừ khi có `$dispatchesEvents` rõ ràng.
- Khi update nội bộ trong model event, dùng `updateQuietly()`/`saveQuietly()` để tránh loop event và tránh bắn side effect ngoài ý muốn.
- Nếu side effect phụ thuộc dữ liệu đã commit, dùng `afterCommit()` hoặc dispatch sau commit để tránh ghost notification/realtime khi transaction rollback.

## Nguyên tắc lõi

- `Method over magic string`
- `Explicit over implicit`
- `Model as source of truth`
- `Ship Parent first`
- `Request as endpoint contract`
- `Thin Controller`
- `Action Task flow`
- `Repository Criteria`
- `Transformer response`
- `Server-owned credentials`
- `Explicit token lifecycle`
- `Provider strategy over conditionals`
- `Business rule before code`
