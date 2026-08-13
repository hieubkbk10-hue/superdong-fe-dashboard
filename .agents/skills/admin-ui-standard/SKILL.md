---
name: admin-ui-standard
description: Quy chuẩn thiết kế và phát triển giao diện Admin Dashboard (React, TanStack Router, TailwindCSS, Shadcn, Lucide React) chuẩn Newmoon-Admin và Superdong. Sử dụng Module Coupon & User và bộ công cụ TableUtilities.tsx làm tham chiếu mẫu chuẩn mực cho mọi màn hình Full-Stack List, Create, Edit.
---

# Admin UI Standard - Quy Chuẩn Thiết Kế & Phát Triển Full-Stack Admin Dashboard

Bộ quy chuẩn thiết kế và lập trình **Full-Stack Frontend & Backend** được đúc kết từ hai module mẫu **Coupon (`src/routes/_admin/coupons/`)**, **User (`src/routes/_admin/users/`)** và bộ tiện ích master **`TableUtilities.tsx` (`src/components/common/TableUtilities.tsx`)**, tuân thủ 100% triết lý UI/UX từ `system-vietadmin-nextjs` và kiến trúc Porto/Apiato Backend.

---

## 📋 CHECKLIST TỰ KIỂM TRÁ BẮT BUỘC KHÔNG ĐƯỢC BỎ BƯỚC (FULL-STACK DEFINITION OF DONE)

Khi phát triển hoặc refactor bất kỳ module CRUD nào (List, Create, Edit), AI Agent **BẮT BUỘC** phải rà soát qua 16 nhóm tiêu chí bên dưới trước khi bàn giao cho anh Hiếu (NGHIÊM CẤM HARDCODE DỮ LIỆU GIẢ / SKIP):

```
[ ] 1. DYNAMIC API DATA FETCHING (CẤM HARDCODE): BẮT BUỘC gọi API trực tiếp từ Backend (ví dụ `getRoles()` từ `/v1/roles`) để render dynamic options cho ô Select/Dropdown ở cả màn Create, Edit và List Filter
[ ] 2. BACKEND INTEGRITY: Migration table, Model $fillable, Request rules(), Action sanitizeInput(), Transformer transform() đầy đủ TẤT CẢ các trường
[ ] 3. INPUT & ROLE DATA PRECISION: AI Agent tự kiểm tra thủ công tính chính xác của từng ô input, option value select và role_name. Giá trị chọn thế nào giữ nguyên 100% không bị trôi role
[ ] 4. CREATE PAGE DEFAULTS & CLEAR DATA: Màn Create BẮT BUỘC để trống input nghiệp vụ chưa biết, chỉ dùng placeholder; chỉ được default giá trị an toàn như status=`active`, checkbox phù hợp domain, và phải có nút 'Làm sạch dữ liệu'
[ ] 5. FRONTEND INPUT FILTER & PASSWORD UI: Lọc live SĐT/Tiền tệ/Phần trăm, PasswordInput với nút Eye toggle + Checklist 4 tiêu chí Apiato (min 8, A-Z/a-z, 0-9, special char)
[ ] 6. F5 & FORM DRAFT PERSISTENCE: Lưu bản nháp tự động cho Form đang nhập dở (F5 không mất dữ liệu) + Re-sync API + Map-Merge Cache cho cả màn Edit và màn List
[ ] 7. DOMAIN & DESIGN: 1 Card liền mạch, w-full, CẤM cột ID nội bộ DB thô, Banner Cyan (#EBF7FA) Số La Mã (I, II, III, IV), DateBox DD/MM/YYYY 1 icon
[ ] 8. BRAND COLOR & BADGES: Blue (#2B7FFF / blue-600) chủ đạo, Badge 4 màu chuẩn (Emerald, Rose, Amber, Blue)
[ ] 9. ADMIN-READABLE COPYWRITING: Tên cột, label, toast, badge BẮT BUỘC viết cho Admin vận hành đọc, CẤM wording dev như "Backend", "Guard", "Permissions" nếu không thật sự cần
[ ] 10. NO FAKE FALLBACK DATA: List/Edit/Create CẤM bịa fallback dữ liệu nghiệp vụ (`28 hải lý/giờ`, `306 ghế`, email/sđt mẫu). Nếu API rỗng thì hiển thị `Chưa cập nhật` hoặc để input trống.
[ ] 11. OPTIONAL UX FIELDS: Trường optional như `color`, `reason`, `note` KHÔNG được ép nhập. Nếu có `color`, ưu tiên dùng common color picker/preview thay vì chỉ text input.
[ ] 12. HARD DELETE WITH SNAPSHOT & RESTRICT CHECK: Nếu module cho phép xóa master data thì phải là xóa thật có kiểm tra ràng buộc; Backend BẮT BUỘC lưu audit snapshot `before_json` trước khi xóa, kiểm tra FK/restrict trước khi delete, trả lỗi 409 nêu rõ record đang dính bảng/nghiệp vụ nào; FE phải có ConfirmModal cảnh báo rõ và toast/error panel hiển thị nguyên nhân xóa không được.
[ ] 13. ROLE/PERMISSION GUARD PRECISION: Role/Permission dành cho dashboard BẮT BUỘC lọc `guard_name === 'api'`; KHÔNG lấy `web` vì `web` là guard nội bộ Backend
[ ] 14. REAL CRUD NAVIGATION & ACTIONS: Nút Tạo/Sửa/Xóa/Lưu BẮT BUỘC navigate hoặc gọi API thật; CẤM toast placeholder kiểu "Tính năng đang phát triển"
[ ] 15. GIT & MASTER BRANCH DEPLOY: Cả Backend và Frontend làm việc trực tiếp trên nhánh master, commit & push thẳng master để Vercel & Live LiteSpeed Server đồng bộ tức thì
[ ] 16. TABLEUTILITIES & LIST PAGE ARCHITECTURE: Mọi trang Danh sách BẮT BUỘC sử dụng Master Component `<AdminTablePage>` từ `TableUtilities.tsx`. Top-Right Actions (`Làm mới`, `+ Thêm mới`), Nút Sắp xếp CHỈ hiển thị khi `sortable: true`, Phân trang nút pill `[1] [2] [3]`, Spacing lề trái `pl-6 pr-4` cho cột đầu tiên, và KHÔNG có badge thừa ở tiêu đề.
```

---

## ⚙️ 1. Quy Chuẩn Backend & Database (Full-Stack Backend Integrity)

> **🔴 BẮT BUỘC AUDIT TRỰC TIẾP REPO `superdong-be` TRƯỚC KHI VIẾT BẤT KỲ FORM NÀO**
>
> Khi bắt tay vào code bất kỳ form Create/Edit nào, AI Agent **BẮT BUỘC** phải đọc trực tiếp các file sau trong repo `e:\cty\superdong-be` theo thứ tự:
>
> **Bước 1 — Đọc `Request` (Input Contract)**
> ```
> app/Containers/<Section>/<Container>/UI/API/Requests/Create<Entity>Request.php
> app/Containers/<Section>/<Container>/UI/API/Requests/Update<Entity>Request.php
> ```
> → Ghi lại: Danh sách field được phép gửi, kiểu dữ liệu (`string`, `array`, `date_format:H:i:s`...), field nào `required` vs `sometimes|nullable`, format enum (`in:mon,tue,...`), giá trị decode hashid.
>
> **Bước 2 — Đọc `Transformer` (Output Contract)**
> ```
> app/Containers/<Section>/<Container>/UI/API/Transformers/<Entity>Transformer.php
> ```
> → Ghi lại: Danh sách field Transformer trả về, field nào encode HashID, field nào là relation, field nào FE cần dùng để hydrate form Edit.
>
> **Bước 3 — Đọc `Action` (sanitizeInput White-list)**
> ```
> app/Containers/<Section>/<Container>/Actions/Create<Entity>Action.php
> app/Containers/<Section>/<Container>/Actions/Update<Entity>Action.php
> ```
> → Kiểm tra `$request->sanitizeInput([...])` có liệt kê đủ field không. Field ngoài danh sách sẽ bị backend tự động bỏ qua dù FE đã gửi.
>
> **Bước 4 — Đọc `Model $fillable`**
> ```
> app/Containers/<Section>/<Container>/Models/<Entity>.php
> ```
> → Xác nhận mọi field muốn lưu đều có trong `$fillable`.
>
> **Sau khi đọc xong 4 bước → Lập Bảng Audit BE vs FE:**
> | Field | Request rule | Transformer output | sanitizeInput | $fillable | FE Form |
> |---|---|---|---|---|---|
> | `name` | required\|string | ✅ | ✅ | ✅ | ✅ |
> | `route_id` | hashid decode | ✅ encode | ✅ | ✅ | ✅ |
> | `expected_version` | sometimes\|integer | ❌ (không trả) | N/A | N/A | ✅ lấy từ `version` |
>
> **NGHIÊM CẤM** bỏ qua bước này và tự đoán field. Mọi field sai sẽ gây lỗi 422, lỗi 405 hoặc BE âm thầm bỏ qua dữ liệu FE gửi lên.

Khi tạo mới hoặc cập nhật module ở Backend (`app/Containers/AppSection/<Domain>/`):

1. **Migration Schema (`Data/Migrations/`)**:
   * Kiểm tra bảng Database BẮT BUỘC có đầy đủ các cột dữ liệu cần lưu (`name`, `email`, `phone`, `status`, `effective_from`, `effective_to`, `reason`, `version`...).
   * **NGHIÊM CẤM** thiếu cột trên Database dẫn đến gửi payload từ Frontend mà Backend không thể lưu được.

2. **Model (`Models/<Entity>.php`)**:
   * Mọi cột dữ liệu có thể chỉnh sửa BẮT BUỘC phải nằm trong mảng `$fillable = ['name', 'email', 'phone', 'status', ...];`.

3. **Request Validation (`UI/API/Requests/<Action>Request.php`)**:
   * Khai báo rule kiểm tra chặt chẽ:
     * Mật khẩu: `User::getPasswordValidationRules()` (tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt).
     * Số điện thoại: `'phone' => 'nullable|string|regex:/^(0|\+?84)[0-9]{8,10}$/'`
     * Email: `'email' => 'nullable|email'`
     * Trạng thái: `'status' => 'nullable|in:active,inactive'`
     * Ngày tháng: `'birth' => 'nullable|date'`

4. **Action Use-Case (`Actions/<Action>Action.php`)**:
   * Mảng `$request->sanitizeInput([...])` BẮT BUỘC liệt kê đầy đủ TẤT CẢ các trường dữ liệu được phép cập nhật. **NGHIÊM CẤM** bỏ sót trường làm Backend tự động nuốt/bỏ qua dữ liệu Frontend gửi lên.

5. **Transformer Contract (`UI/API/Transformers/<Entity>Transformer.php`)**:
   * Phương thức `transform()` BẮT BUỘC trả về đầy đủ TẤT CẢ các trường thông tin cho Frontend (`name`, `email`, `phone`, `status`, `roles`...).

6. **Guard Contract cho Role & Permission**:
   * Endpoint phục vụ dashboard (`/v1/roles`, `/v1/permissions`) BẮT BUỘC chỉ trả dữ liệu `guard_name = api`.
   * Nếu Backend vẫn có dữ liệu `web`, phải filter ở Task/Action bằng `whereGuard('api')` hoặc query tương đương.
   * Transformer Role/Permission BẮT BUỘC trả `guard_name` để Frontend có lớp phòng vệ thứ hai.
   * Frontend BẮT BUỘC filter lại `(guard_name || 'api') === 'api'` trước khi dedupe, render, sync quyền.
   * **CẤM** dedupe role chỉ theo `name` trước khi lọc guard, vì `admin/web` có thể đứng trước `admin/api` và làm Edit bị 404.

7. **ApiDoc bắt buộc sau khi đổi Backend API**:
   * Khi thêm/sửa Route, Request, Transformer, hoặc response contract, BẮT BUỘC chạy:
     `php artisan apiato:apidoc`
   * Route ApiDoc phải dùng title tiếng Anh ở dòng `@api`, ví dụ `Update Role`, `Get All Roles`.
   * `@apiPermission`, `@apiHeader`, `@apiParam`, `@apiBody` phải đúng chuẩn Apiato. Không viết tiếng Việt tự do trong `@apiPermission`.
   * Nếu apidoc fail do chạy sai thư mục, phải chạy lại từ root backend repo (`E:\cty\superdong-be`).

---

## 🛡️ 2. Quy Chuẩn Dynamic API Fetching & Input Precision

1. **Tuyệt Đối KHÔNG Hardcode Dữ Liệu - Bắt Buộc Gọi API Thật (`Dynamic API Data Fetching`)**:
   * **QUY TẮC BẮT BUỘC**: AI Agent tuyệt đối **KHÔNG ĐƯỢC HARDCODE** mảng tĩnh làm giá trị mặc định cho ô Select/Dropdown (như danh sách Roles, Danh mục, Bến tàu, Tuyến tàu).
   * BẮT BUỘC phải sử dụng `useEffect` gọi API thực tế từ Backend (như `getRoles()` từ endpoint `/v1/roles`) để nạp mảng dữ liệu sống trực tiếp từ Database.
   * Chỉ dùng mảng fallback domain thực tế khi kết nối mạng hoặc Backend API bị ngắt.

2. **Không Được Làm Form/List Demo hoặc Toast Placeholder**:
   * Nút **Tạo mới** trên List phải dùng `<Link to="/<entity>/create">` hoặc navigate thật.
   * Nút **Sửa** trong từng dòng phải dùng `<Link to="/<entity>/$id/edit">` với ID API đúng.
   * Nút **Lưu** ở Create/Edit phải gọi API thật, xử lý loading, success, error, và re-fetch khi cần.
   * **CẤM** các handler chỉ `toast.info('Tính năng ...')` ở các action chính.
   * Nếu Backend thiếu endpoint cho Edit/Delete/Sync, phải bổ sung flow Apiato đúng chuẩn thay vì giả lập ở Frontend.

3. **Lọc Ký Tự Trực Tiếp Trên Ô Nhập (Live Input Filter)**:
   * **Số điện thoại**: BẮT BUỘC lọc sạch các ký tự không phải chữ số ngay khi người dùng gõ:
     `onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })}`.
     $\rightarrow$ Tuyệt đối KHÔNG cho phép người dùng gõ chữ cái (như `ws`, `abc`) hay ký tự đặc biệt vào ô SĐT.
   * **Số tiền tệ / Phần trăm**: Lọc bỏ số âm và chữ cái.

4. **Giao Diện Ô Mật Khẩu Thông Minh (`PasswordInput.tsx`)**:
   * BẮT BUỘC dùng component `<PasswordInput>` tích hợp:
     * Icon mắt `Eye` / `EyeOff` bật/tắt hiển thị mật khẩu.
     * Bảng checklist 4 quy định mật khẩu Backend Apiato tự động tích xanh theo thời gian thực (Live Validation Checklist):
       1. `✓ Tối thiểu 8 ký tự`
       2. `✓ Chữ hoa (A-Z) & chữ thường (a-z)`
       3. `✓ Chữ số (0-9)`
       4. `✓ Ký tự đặc biệt (!@#$%...)`

5. **Trường Optional Không Được Ép Nhập**:
   * Các trường như `reason`, `note`, `description`, `color` chỉ được bắt buộc khi nghiệp vụ hoặc Backend bắt buộc thật sự.
   * Nếu `reason` chỉ để audit/log, ưu tiên optional. Khi để trống, Backend tự ghi lý do mặc định rõ nghĩa, ví dụ `Cập nhật hạng ghế từ dashboard vận hành`.
   * Label optional không có dấu `*`, placeholder phải nói rõ "Không bắt buộc" nếu dễ gây hiểu nhầm.

6. **Color Picker Cho Trường Màu Nhận Diện**:
   * Nếu form có field `color`, ưu tiên tìm và dùng common component từ `E:\cty\Newmoon-Admin` trước.
   * Nếu không có component phù hợp, tạo common component nội bộ dùng được lại, gồm:
     * Native `<input type="color">` để chọn màu nhanh.
     * Ô text hex để nhập tay.
     * Preview màu hiện tại.
   * Không chỉ để text input trống trơn cho `color`, vì Admin khó biết đang chọn màu gì.

---

## 🔄 3. Cơ Chế Nút Làm Sạch & Đồng Bộ Dữ Liệu Form Đang Nhập Dở Khi F5

1. **Nút Làm Sạch Dữ Liệu Ở Màn Create (`Create Page Clear Data Button`)**:
   * Mọi màn hình Create (`create.tsx`) BẮT BUỘC có nút nhỏ gọn **`Làm sạch dữ liệu`** (`RotateCcw` icon) ở góc trên Header bar bên cạnh tiêu đề.
   * Nút này cho phép reset toàn bộ ô input về trống và xóa sạch bản nháp `localStorage.removeItem(...)`.
   * **NGHIÊM CẤM** thêm nút "Làm sạch dữ liệu" ở các trang Chỉnh sửa Edit (`edit.tsx`).

2. **Create Form Defaults Không Được Là Dữ Liệu Giả**:
   * Màn Create phải để trống các input nghiệp vụ mà Admin cần nhập thật, ví dụ `code`, `name`, `capacity`, `speed`, `phone`, `price`, `email`.
   * Chỉ dùng placeholder để gợi ý format, ví dụ `VD: SD-09`, `VD: 30 hải lý/giờ`; placeholder KHÔNG được gửi trong payload.
   * Chỉ được đặt default cho giá trị an toàn và có ý nghĩa vận hành:
     * `status = active` nếu record mới mặc định hoạt động.
     * Checkbox boolean có default theo domain rõ ràng, ví dụ tàu cao tốc mặc định `is_express = true` nếu màn tên là "Thêm Tàu Cao Tốc".
   * Nếu input optional để trống, payload gửi lên phải là `null` hoặc bỏ field, KHÔNG gửi chuỗi ví dụ.
   * Nếu input required để trống, phải chặn submit bằng toast tiếng Việt rõ ràng trước khi gọi API.

3. **Form Draft Persistence (Tự Động Lưu Nháp Form Đang Nhập Dở Khi F5)**:
   * Tất cả các form Create/Edit khi người dùng đang nhập dở (như tên `Trần Mạnh Hiếu`, email `tranmanhhieu10@gmail.com`, SĐT `0948066514`) BẮT BUỘC tự động sao lưu bản nháp vào `localStorage` (`superdong_<entity>_draft_create`).
   * Khi người dùng bấm **F5 (Reload trang)**, form tự khôi phục lại 100% dữ liệu đang nhập dở mà KHÔNG BỊ MẤT THÔNG TIN.
   * Bản nháp chỉ bị xóa `localStorage.removeItem(...)` khi submit thành công hoặc bấm nút Hủy.

4. **Post-Save Re-sync (Đồng Bộ Dữ Liệu Sau Khi Lưu)**:
   * Ngay sau khi gọi API cập nhật thành công và hiển thị `toast.success(...)`, Frontend BẮT BUỘC thực hiện re-fetch lại dữ liệu mới nhất từ Server (ví dụ `findUserById(id)` / `findCouponById(id)`) và cập nhật lại state `setFormData(...)`.

5. **List View Cache Merge (Đồng Bộ Dữ Liệu Cho Màn Danh Sách)**:
   * Mọi trang Danh Sách (List View) khi fetch mảng dữ liệu từ API BẮT BUỘC phải map-merge mảng kết quả với `localStorage` cache fallback (`superdong_<entity>_cache_${item.id}`) của từng dòng.
   * Cache chỉ được merge dữ liệu người dùng vừa lưu thật. **CẤM** dùng cache/fallback để bịa số liệu nghiệp vụ.

---

## 🎨 4. Quy Chuẩn Màu Sắc & Nhận Diện Thương Hiệu (Brand Theme)

* **Màu Chủ Đạo Thương Hiệu (Primary Brand Color)**: **Tông Xanh Dương (`blue-600` / `#2B7FFF`)**
  * Nút bấm chính: `bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg`
  * Khung mã code / Highlight badge: `bg-blue-50 text-blue-600 border-blue-200`
  * Icon sắp xếp bảng & active state: `text-blue-600 dark:text-blue-400`
  * Viền focus ring ô nhập liệu: `focus:border-blue-500`

* **Màu Trạng Thái Chuẩn (Status Palette)**:
  * **Success (Kích hoạt / Đã thanh toán)**: `bg-emerald-50 text-emerald-700 border-emerald-200`
  * **Danger (Khóa / Thất bại)**: `bg-rose-50 text-rose-700 border-rose-200`
  * **Warning (Cảnh báo / Quản lý)**: `bg-amber-50 text-amber-700 border-amber-200`
  * **Blue / Primary (Super Admin / Mã mới)**: `bg-blue-50 text-blue-700 border-blue-200`

---

## 📐 5. Cấu Trúc Bố Cục Màn Hình (Layout Architecture)

### 5.1. Màn Hình Danh Sách Master (`TableUtilities.tsx` & `<AdminTablePage>`)
* **BẮT BUỘC DÙNG `<AdminTablePage>` / `TableUtilities.tsx`**: Mọi trang danh sách BẮT BUỘC phải sử dụng Master Component `<AdminTablePage>` được đóng gói trong `src/components/common/TableUtilities.tsx`.
* **CẤM HIỂN THỊ CỘT ID NỘI BỘ DB THÔ**: Tuyệt đối **KHÔNG** hiển thị cột ID băm/ID số nội bộ DB (như `#mEGx1djKqo3ABbOn`) làm cột riêng trong Bảng Danh Sách List View. Bảng chỉ hiển thị các cột thông tin có ý nghĩa nghiệp vụ cho người dùng Admin.
* **Quy tắc Vàng Cho Tiêu Đề Header (`<PageHeader>`)**:
  * **Vị trí Nút bấm Hành động**: Nút `Làm mới` (`<RefreshCw>`) và nút `+ Thêm mới` (`<Plus>`) BẮT BUỘC nằm ở **Góc Phải Hàng Tiêu Đề Header** (ngang hàng với tiêu đề H1).
  * **CẤM Badge Thừa**: KHÔNG hiển thị các badge dư thừa như "Dữ liệu đang đồng bộ" hay "Live API Backend" bên cạnh tiêu đề H1 để giữ giao diện tối giản và thanh thoát.
* **Quy tắc Vàng Cho Sắp Xếp Cột (`SortableHeader` & `useSortableData`)**:
  * **QUY TẮC BẮT BUỘC**: Mũi tên Sắp xếp (`ChevronsUpDown`, `ChevronUp`, `ChevronDown`) **CHỈ HIỂN THỊ KHI CỘT ĐƯỢC KHAI BÁO `sortable: true`**.
  * Các cột không khai báo `sortable: true` hoặc cột `actions` tuyệt đối KHÔNG có mũi tên sort.
  * Khi sort chuỗi tiếng Việt (ví dụ "Superdong I", "Superdong II"...), BẮT BUỘC dùng `localeCompare(..., 'vi', { numeric: true, sensitivity: 'base' })` để xếp thứ tự tự nhiên chuẩn xác.
* **Quy tắc Tiêu Đề Cột Ngắn Gọn & Chống Rớt Chữ (`whitespace-nowrap`)**:
  * **Tiêu đề Cột Tối Đa 2 Từ**: Tên tiêu đề cột phải cô đọng, súc tích, tối đa 2 từ đủ ý (ví dụ: `MÃ TÀU`, `TÊN TÀU`, `SỨC CHỨA`, `TỐC ĐỘ`, `MÃ HẠNG`, `GIÁ CƠ SỞ`, `TRẠNG THÁI`, `THAO TÁC`). Tránh dùng 3-4 từ rườm rà như `TỐC ĐỘ VẬN HÀNH` hay `SỨC CHỨA (GHẾ)`.
  * **Tuyệt Đối Không Rớt Chữ (`whitespace-nowrap`)**: Toàn bộ tiêu đề `<th>` và nội dung dòng `<td>` (tên tàu, badge trạng thái `Tàu Cao Tốc`, `Đang hoạt động`,...) BẮT BUỘC có class `whitespace-nowrap` để tuyệt đối KHÔNG bao giờ bị vỡ hoặc rớt chữ xuống dòng.
* **Spacing Cột Đầu Tiên (`pl-6 pr-4`)**:
  * Cột đầu tiên của bảng (`th:first-child`, `td:first-child`) BẮT BUỘC có padding `pl-6 pr-4` để dữ liệu không bị dính sát vào đường viền mép trái của Card container.
* **Thanh Bộ Lọc `<TableToolbar>`**:
  * Chứa ô `<SearchInput>` (kèm nút xóa nhanh `X`).
  * Dropdown chọn bộ lọc `<FilterSelect>` (hỗ trợ Wheel Picker trên Mobile và Popover trên Desktop).
  * Dropdown ẩn/hiện cột `<ColumnToggleDropdown>` (checkbox + tự động lưu cấu hình vào `localStorage`).
* **Thanh Phân Trang `<PaginationBar>`**:
  * Nút chọn số trang dạng pill nút bấm nổi bật (`[1]`, `[2]`, `[3]`...).
  * Hiển thị phạm vi chuẩn: `1–10 / 50 mục`.
  * Bộ chọn số dòng `Hiển thị [10 ▾] mục/trang` đẹp mắt.

### 5.2. Màn Hình Tạo Mới & Chỉnh Sửa (Create & Edit Forms)
* **Tràn viền `w-full`**: Toàn bộ form nằm trong **1 khung Card duy nhất** (`bg-white shadow-2xs`).
* **Thanh Banner Nhóm Số La Mã Màu Cyan Nhạt (`bg-[#EBF7FA]`)**:
  * `I. THÔNG TIN CÁ NHÂN` / `I. THÔNG TIN CƠ BẢN`
  * `II. THÔNG TIN TÀI KHOẢN & LIÊN HỆ` / `II. MỨC GIẢM GIÁ & ĐIỀU KIỆN ÁP DỤNG`
  * `III. PHÂN QUYỀN & VAI TRÒ` / `III. THỜI HẠN & GIỚI HẠN SỬ DỤNG`
  * `IV. TRẠNG THÁI & GHI CHÚ`
* **Component Ô Chọn Ngày `<DateBox>`**: Định dạng ngày Việt Nam `DD/MM/YYYY` kèm **đúng 1 Icon Lịch duy nhất**.
* **Thanh Nút Bấm Hành Động Dưới Cùng**: `Hủy Bỏ` & `Lưu thay đổi` (góc phải).

---

## 📂 8. Danh Sách File Mẫu Chuẩn Mực (Golden Reference Source Files)

* **Master Table Component**: [TableUtilities.tsx](file:///E:/cty/superdong-fe-dashboard/src/components/common/TableUtilities.tsx)
* **PasswordInput Component**: [PasswordInput.tsx](file:///E:/cty/superdong-fe-dashboard/src/components/common/PasswordInput.tsx)
* **Fleet Boat Modules**:
  * List: [boats/index.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/boats/index.tsx)
  * Create: [boats/create.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/boats/create.tsx)
  * Edit: [boats/$boatId.edit.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/boats/$boatId.edit.tsx)
* **Seat Class Modules**:
  * List: [seat-classes/index.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/seat-classes/index.tsx)
  * Create: [seat-classes/create.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/seat-classes/create.tsx)
  * Edit: [seat-classes/$classId.edit.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/seat-classes/$classId.edit.tsx)
* **Seat Map Modules**:
  * List: [seat-maps/index.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/seat-maps/index.tsx)
  * Create: [seat-maps/create.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/seat-maps/create.tsx)
  * Edit: [seat-maps/$seatMapId.edit.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/seat-maps/$seatMapId.edit.tsx)
