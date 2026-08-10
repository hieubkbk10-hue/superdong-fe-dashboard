# AGENTS.md

## 1. Nguyên tắc vận hành cốt lõi

- Trả lời bằng Tiếng Việt có dấu khi làm việc với repo này.
- Tuân thủ bộ quy chuẩn công ty tại `.factory/standards/quy_chuan_code_cong_ty.md` và quy chuẩn đặt tên Laravel/Apiato tại `.factory/standards/quy_chuan_dat_ten_laravel_apiato.md` khi áp dụng được. Nếu có xung đột với AGENTS.md, ưu tiên AGENTS.md cho các quy tắc đặc thù của repo Laravel/Apiato này.
- Tuân thủ KISS, YAGNI, DRY. Ưu tiên thay đổi nhỏ, dễ đọc, dễ rollback.
- Không mở rộng scope ngoài yêu cầu. Chỉ sửa đúng phần liên quan trực tiếp đến task.
- Không tự ý format/refactor code lân cận nếu không cần thiết, tránh git noise và regression.
- Khi kết luận hoặc đề xuất, tách rõ Observation, Inference, Decision và nêu evidence bằng file path, command output hoặc dòng code liên quan.
- Khi tổng hợp sơ đồ luồng nghiệp vụ hệ thống, ưu tiên viết/cập nhật vào file `docs/nghiepvu.md` theo mẫu **Cross-Entity Interactive Mindmap** (định dạng Markdown Markmap: phân rã cấp độ thu gọn/mở rộng + dùng tham chiếu chéo `[🔗 Ref]` để chống lặp node).

## 2. Vệ sinh workspace

- Không tạo file nháp ở root project hoặc trong module cốt lõi nếu file đó không có mục đích lâu dài.
- Nếu cần script/file tạm để thử nghiệm, đặt trong thư mục nháp riêng và dọn sạch trước khi bàn giao.
- Không commit file rác, build artifact, log, cache, dump database hoặc file chứa dữ liệu nhạy cảm.
- Không đọc/in nội dung `.env`, private key, token hoặc secret. Chỉ tham chiếu cấu hình qua `.env.example` khi cần.

## 3. Stack và phạm vi dự án

- Repo này là Laravel 9 / PHP >8.0.2 theo kiến trúc Apiato, Porto.
- Code nghiệp vụ nằm trong `app/Containers/AppSection/<Container>`.
- Code dùng chung, base class, middleware, helper, config nền tảng nằm trong `app/Ship`.
- Frontend asset hiện dùng Laravel Mix/Webpack qua `webpack.mix.js`, entry chính là `resources/js/app.js` và `resources/css/app.css`.
- Không thêm code hoặc cấu trúc Next.js như `app/`, `pages/`, `middleware.ts`, Server Components, route handlers, `next.config.*`.
- Không thêm Convex, Bun, Vite, Tailwind, Shadcn hoặc React dependency mới nếu task không yêu cầu rõ.

## 4. Quy ước Laravel, Apiato, Porto

- Bám flow hiện có: Route -> Controller -> Request -> Action -> Task -> Repository/Model -> Transformer.
- Controller phải mỏng: nhận Request, gọi Action, trả Transformer hoặc response phù hợp.
- Business orchestration đặt trong Action.
- Data access, query, mutation đặt trong Task hoặc Repository theo pattern container hiện có.
- Validation và authorization đặt trong Request class, giữ các pattern Apiato như `$access`, `$decode`, `$urlParameters` khi file hiện có sử dụng.
- API routes đặt trong `UI/API/Routes`, giữ naming dạng `ActionName.v1.private.php` hoặc `ActionName.v1.public.php`.
- Route private dùng middleware/auth guard hiện có, ví dụ `auth:api`.
- Khi đổi behavior endpoint, giữ và cập nhật block `@api` documentation ngay trong route file nếu block đó tồn tại.
- Web route, Blade view, CLI command, mail, notification phải đặt đúng tầng `UI/WEB`, `UI/CLI`, `Mails`, `Notifications` của container tương ứng.
- Shared logic chỉ đưa vào `app/Ship` khi thật sự dùng lại qua nhiều container.

## 5. Database, migration và performance

- Dùng Laravel migrations, seeders, factories theo vị trí của container hoặc `app/Ship` hiện có.
- Với thay đổi schema hoặc data contract, ưu tiên Expand -> Migrate -> Contract.
- Không biến fallback legacy thành thiết kế lâu dài. Nếu cần fallback, ghi rõ điều kiện gỡ bỏ trong code/task liên quan.
- Filter ở database, không fetch toàn bộ rồi lọc bằng PHP/JS.
- Tránh N+1 query. Dùng eager loading, batch load, repository criteria hoặc query phù hợp.
- Thêm index khi thêm query pattern mới có filter/sort đáng kể.
- Dùng pagination/limit cho danh sách, tránh endpoint trả dữ liệu không giới hạn.
- Dùng transaction cho workflow ghi nhiều bảng hoặc có nhiều bước phụ thuộc nhau.

## 6. React và frontend asset

- Nếu task yêu cầu React, tích hợp trong Laravel asset pipeline hiện có trước, không chuyển dự án sang Next.js.
- Đặt code frontend dưới `resources/js` và style dưới `resources/css` trừ khi repo đã có convention cụ thể hơn.
- Không thêm global state, router, UI framework hoặc build tool mới khi chưa có yêu cầu rõ.
- Component UI phải rõ ràng, accessible và responsive: focus visible, keyboard navigation, contrast đủ đọc, touch target dễ bấm.
- Ưu tiên text ngắn, hierarchy rõ, tránh animation/shadow/gradient thừa.
- Dùng Axios/bootstrap hiện có nếu phù hợp, không thêm client HTTP mới nếu không cần.

## 7. Testing và verification

- Sau khi sửa code, chạy validator phù hợp trước khi bàn giao hoặc commit.
- Lệnh thường dùng:
  - `composer validate --strict`
  - `vendor/bin/php-cs-fixer fix --config=php_cs.dist.php --dry-run --diff`
  - `vendor/bin/psalm --config=psalm.dist.xml`
  - `vendor/bin/phpunit`
  - `vendor/bin/phpunit --testsuite Unit`
  - `vendor/bin/phpunit --testsuite Functional`
  - `npm run dev`
  - `npm run prod`
- Không chạy build nặng khi thay đổi không chạm frontend/build pipeline.
- Nếu validator fail vì môi trường thiếu dependency/database, ghi rõ lệnh, lỗi chính và phần đã verify được.

## 8. Git workflow

- Trước khi commit hoặc push, luôn kiểm tra `git status`, `git diff` và `git diff --cached`.
- Chỉ stage file liên quan đến task. Không stage untracked file lạ nếu chưa xác minh.
- Không commit secret, `.env`, private key, log, cache hoặc build output ngoài quy ước repo.
- Commit message ngắn gọn, mô tả lý do/thay đổi chính.
- Chỉ push khi user yêu cầu rõ. Khi push, ưu tiên remote/branch hiện tại và tránh force push.

## 9. Khi gặp bug hoặc yêu cầu mơ hồ

- Audit trước, rồi mới fix. Xác định expected vs actual, phạm vi ảnh hưởng, điều kiện tái hiện và tiêu chí pass/fail.
- Nếu có nhiều hướng hợp lý ảnh hưởng behavior/API/UX/risk, hỏi lại bằng lựa chọn rõ ràng.
- Nếu chỉ có một hướng an toàn và đúng pattern repo, tự triển khai và nêu giả định ngắn gọn khi bàn giao.

## 10. Quy chuẩn comment code

- Comment lý do **"TẠI SAO" (Why)**, không comment hành động **"CÁI GÌ" (What)** khi tên hàm/biến đã tự giải thích.
- Bắt buộc comment cho: logic nghiệp vụ ngầm, edge-case đặc biệt, hoặc hack/workaround lách lỗi thư viện (kèm link issue/lý do).
- Ưu tiên dùng tiền tố chuẩn hóa từ `.factory`: `// QUYỀN:` (phân quyền), `// LOGIC:` (thuật toán/nghiệp vụ), `// UI:` (giao diện/kích thước động).
- Viết PHPDoc/Docblock cho Action, Task, DTO/Props để hỗ trợ IDE Intellisense; duy trì block `@api` documentation trong các file route Apiato.
- Tuyệt đối không commit code cũ bị comment (dead code); xóa hẳn vì Git đã lưu vết history.
