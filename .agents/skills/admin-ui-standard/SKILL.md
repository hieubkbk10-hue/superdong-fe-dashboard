---
name: admin-ui-standard
description: Quy chuẩn thiết kế và phát triển giao diện Admin Dashboard (React, TanStack Router, TailwindCSS, Shadcn, Lucide React) chuẩn Newmoon-Admin và Superdong. Sử dụng Module Coupon & User làm tham chiếu mẫu chuẩn mực cho mọi màn hình Full-Stack List, Create, Edit.
---

# Admin UI Standard - Quy Chuẩn Thiết Kế & Phát Triển Full-Stack Admin Dashboard

Bộ quy chuẩn thiết kế và lập trình **Full-Stack Frontend & Backend** được đúc kết từ hai module mẫu **Coupon (`src/routes/_admin/coupons/`)** và **User (`src/routes/_admin/users/`)**, tuân thủ 100% triết lý UI/UX từ `Newmoon-Admin` và kiến trúc Porto/Apiato Backend.

---

## 📋 CHECKLIST TỰ KIỂM TRÁ BẮT BUỘC KHÔNG ĐƯỢC BỎ BƯỚC (FULL-STACK DEFINITION OF DONE)

Khi phát triển hoặc refactor bất kỳ module CRUD nào (List, Create, Edit), AI Agent **BẮT BUỘC** phải rà soát qua 9 nhóm tiêu chí bên dưới trước khi bàn giao cho anh Hiếu (NGHIÊM CẤM HARDCODE DỮ LIỆU GIẢ / SKIP):

```
[ ] 1. DYNAMIC API DATA FETCHING (CẤM HARDCODE): BẮT BUỘC gọi API trực tiếp từ Backend (ví dụ `getRoles()` từ `/v1/roles`) để render dynamic options cho ô Select/Dropdown ở cả màn Create, Edit và List Filter
[ ] 2. BACKEND INTEGRITY: Migration table, Model $fillable, Request rules(), Action sanitizeInput(), Transformer transform() đầy đủ TẤT CẢ các trường
[ ] 3. INPUT & ROLE DATA PRECISION: AI Agent tự kiểm tra thủ công tính chính xác của từng ô input, option value select và role_name. Giá trị chọn thế nào giữ nguyên 100% không bị trôi role
[ ] 4. CREATE PAGE CLEAR DATA BUTTON: Màn Create BẮT BUỘC có nút nhỏ gọn 'Làm sạch dữ liệu' (Clear Form) reset toàn bộ input và xóa bản nháp (CẤM thêm ở màn Edit)
[ ] 5. FRONTEND INPUT FILTER & PASSWORD UI: Lọc live SĐT/Tiền tệ/Phần trăm, PasswordInput với nút Eye toggle + Checklist 4 tiêu chí Apiato (min 8, A-Z/a-z, 0-9, special char)
[ ] 6. F5 & FORM DRAFT PERSISTENCE: Lưu bản nháp tự động cho Form đang nhập dở (F5 không mất dữ liệu) + Re-sync API + Map-Merge Cache cho cả màn Edit và màn List
[ ] 7. DOMAIN & DESIGN: 1 Card liền mạch, w-full, CẤM cột ID nội bộ DB thô, Banner Cyan (#EBF7FA) Số La Mã (I, II, III, IV), DateBox DD/MM/YYYY 1 icon
[ ] 8. BRAND COLOR & BADGES: Blue (#2B7FFF / blue-600) chủ đạo, Badge 4 màu chuẩn (Emerald, Rose, Amber, Blue)
[ ] 9. GIT & MASTER BRANCH DEPLOY: Cả Backend và Frontend làm việc trực tiếp trên nhánh master, commit & push thẳng master để Vercel & Live LiteSpeed Server đồng bộ tức thì
```

---

## ⚙️ 1. Quy Chuẩn Backend & Database (Full-Stack Backend Integrity)

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

---

## 🛡️ 2. Quy Chuẩn Dynamic API Fetching & Input Precision

1. **Tuyệt Đối KHÔNG Hardcode Dữ Liệu - Bắt Buộc Gọi API Thật (`Dynamic API Data Fetching`)**:
   * **QUY TẮC BẮT BUỘC**: AI Agent tuyệt đối **KHÔNG ĐƯỢC HARDCODE** mảng tĩnh làm giá trị mặc định cho ô Select/Dropdown (như danh sách Roles, Danh mục, Bến tàu, Tuyến tàu).
   * BẮT BUỘC phải sử dụng `useEffect` gọi API thực tế từ Backend (như `getRoles()` từ endpoint `/v1/roles`) để nạp mảng dữ liệu sống trực tiếp từ Database.
   * Chỉ dùng mảng fallback domain thực tế khi kết nối mạng hoặc Backend API bị ngắt.

2. **Lọc Ký Tự Trực Tiếp Trên Ô Nhập (Live Input Filter)**:
   * **Số điện thoại**: BẮT BUỘC lọc sạch các ký tự không phải chữ số ngay khi người dùng gõ:
     `onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })}`.
     $\rightarrow$ Tuyệt đối KHÔNG cho phép người dùng gõ chữ cái (như `ws`, `abc`) hay ký tự đặc biệt vào ô SĐT.
   * **Số tiền tệ / Phần trăm**: Lọc bỏ số âm và chữ cái.

3. **Giao Diện Ô Mật Khẩu Thông Minh (`PasswordInput.tsx`)**:
   * BẮT BUỘC dùng component `<PasswordInput>` tích hợp:
     * Icon mắt `Eye` / `EyeOff` bật/tắt hiển thị mật khẩu.
     * Bảng checklist 4 quy định mật khẩu Backend Apiato tự động tích xanh theo thời gian thực (Live Validation Checklist):
       1. `✓ Tối thiểu 8 ký tự`
       2. `✓ Chữ hoa (A-Z) & chữ thường (a-z)`
       3. `✓ Chữ số (0-9)`
       4. `✓ Ký tự đặc biệt (!@#$%...)`

---

## 🔄 3. Cơ Chế Nút Làm Sạch & Đồng Bộ Dữ Liệu Form Đang Nhập Dở Khi F5

1. **Nút Làm Sạch Dữ Liệu Ở Màn Create (`Create Page Clear Data Button`)**:
   * Mọi màn hình Create (`create.tsx`) BẮT BUỘC có nút nhỏ gọn **`Làm sạch dữ liệu`** (`RotateCcw` icon) ở góc trên Header bar bên cạnh tiêu đề.
   * Nút này cho phép reset toàn bộ ô input về trống và xóa sạch bản nháp `localStorage.removeItem(...)`.
   * **NGHIÊM CẤM** thêm nút "Làm sạch dữ liệu" ở các trang Chỉnh sửa Edit (`edit.tsx`).

2. **Form Draft Persistence (Tự Động Lưu Nháp Form Đang Nhập Dở Khi F5)**:
   * Tất cả các form Create/Edit khi người dùng đang nhập dở (như tên `Trần Mạnh Hiếu`, email `tranmanhhieu10@gmail.com`, SĐT `0948066514`) BẮT BUỘC tự động sao lưu bản nháp vào `localStorage` (`superdong_<entity>_draft_create`).
   * Khi người dùng bấm **F5 (Reload trang)**, form tự khôi phục lại 100% dữ liệu đang nhập dở mà KHÔNG BỊ MẤT THÔNG TIN.
   * Bản nháp chỉ bị xóa `localStorage.removeItem(...)` khi submit thành công hoặc bấm nút Hủy.

3. **Post-Save Re-sync (Đồng Bộ Dữ Liệu Sau Khi Lưu)**:
   * Ngay sau khi gọi API cập nhật thành công và hiển thị `toast.success(...)`, Frontend BẮT BUỘC thực hiện re-fetch lại dữ liệu mới nhất từ Server (ví dụ `findUserById(id)` / `findCouponById(id)`) và cập nhật lại state `setFormData(...)`.

4. **List View Cache Merge (Đồng Bộ Dữ Liệu Cho Màn Danh Sách)**:
   * Mọi trang Danh Sách (List View) khi fetch mảng dữ liệu từ API BẮT BUỘC phải map-merge mảng kết quả với `localStorage` cache fallback (`superdong_<entity>_cache_${item.id}`) của từng dòng.

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

### 5.1. Màn Hình Danh Sách (List Page - `index.tsx`)
* **CẤM HIỂN THỊ CỘT ID NỘI BỘ DB THÔ**: Tuyệt đối **KHÔNG** hiển thị cột ID băm/ID số nội bộ DB (như `#mEGx1djKqo3ABbOn`) làm cột riêng trong Bảng Danh Sách List View. Bảng chỉ hiển thị các cột thông tin có ý nghĩa nghiệp vụ cho người dùng Admin (Họ tên & Email, Mã Code Khuyến Mãi `SUMMER2026`, SĐT, Vai Trò, Trạng Thái, Hành Động).
* **Top Header Bar**: Icon đại diện + Tiêu đề + Nút `Làm mới` (spinner animation) + Nút `+ Tạo mới`.
* **Filter Bar Đầy Đủ 4 Dropdown**:
  1. `<SearchInput>`: Ô tìm kiếm dùng icon kính lúp.
  2. `<select>` Lọc trạng thái / danh mục (`Tất cả`, `Kích hoạt`, `Đã khóa`).
  3. **Column Visibility Dropdown (`Cột`)**: Checkbox bật/tắt cột + link `Mặc định` reset + **lưu `localStorage`**.
  4. **Pagination Rows Per Page Dropdown**: Choose `5`, `10`, `20`, `50` dòng/trang.
* **Bảng `<DataTable>`**: Header in hoa `#F9FAFB`, Sắp xếp 3 trạng thái (Asc $\rightarrow$ Desc $\rightarrow$ None), Skeleton loading, Empty state.
* **Thanh Phân Trang `<PaginationBar>`** & **Modal Xác Nhận Xóa `<ConfirmModal>`**.

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

## 🔒 6. Quy Chuẩn Bảo Vệ Quyền Hạn & Security Guards

1. **Bảo Vệ Tài Khoản Super Admin Gốc**:
   * Tài khoản root (`admin@admin.com` / `Super Admin`) **TUYỆT ĐỐI KHÔNG THỂ BỊ XÓA**: Thay nút xóa bằng **Icon Ổ Khóa (`Lock`)** mờ kèm tooltip *"Tài khoản Super Admin gốc hệ thống - Không thể xóa"*.
   * Dropdown **Vai Trò Hệ Thống** và Checkbox **Trạng Thái Kích Hoạt** của Super Admin BẮT BUỘC bị khoá `disabled`, giữ nguyên vai trò tối cao và trạng thái Kích hoạt.

---

## 🚀 7. Quy Chuẩn Git Master Workflow Cho Cả Backend & Frontend

1. **Backend (`superdong-be`)**:
   * Toàn bộ phát triển và chỉnh sửa thực hiện trực tiếp trên nhánh **`master`**.
   * Khi làm xong task: `git add . && git commit -m "..." && git push origin master`.
   * LiteSpeed Live Server (`https://superdong-be.vitrasau.info.vn`) sẽ tự động kích hoạt deploy bản mới nhất ngay lập tức.

2. **Frontend (`superdong-fe-dashboard`)**:
   * Toàn bộ phát triển thực hiện trực tiếp trên nhánh **`master`**.
   * Push code thẳng lên `origin/master` để Vercel tự động kích hoạt build & deploy live dashboard.

---

## 📂 8. Danh Sách File Mẫu Chuẩn Mực (Golden Reference Source Files)

* **PasswordInput Component**: [PasswordInput.tsx](file:///E:/cty/superdong-fe-dashboard/src/components/common/PasswordInput.tsx)
* **Coupon Module**:
  * List: [coupons/index.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/coupons/index.tsx)
  * Create: [coupons/create.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/coupons/create.tsx)
  * Edit: [coupons/$couponId.edit.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/coupons/$couponId.edit.tsx)

* **User Module**:
  * List: [users/index.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/users/index.tsx)
  * Create: [users/create.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/users/create.tsx)
  * Edit: [users/$userId.edit.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/users/$userId.edit.tsx)
