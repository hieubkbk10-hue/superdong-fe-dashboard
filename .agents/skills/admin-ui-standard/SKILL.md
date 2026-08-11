---
name: admin-ui-standard
description: Quy chuẩn thiết kế và phát triển giao diện Admin Dashboard (React, TanStack Router, TailwindCSS, Shadcn, Lucide React) chuẩn Newmoon-Admin và Superdong. Sử dụng Module Coupon & User làm tham chiếu mẫu chuẩn mực cho mọi màn hình Full-Stack List, Create, Edit.
---

# Admin UI Standard - Quy Chuẩn Thiết Kế & Phát Triển Full-Stack Admin Dashboard

Bộ quy chuẩn thiết kế và lập trình **Full-Stack Frontend & Backend** được đúc kết từ hai module mẫu **Coupon (`src/routes/_admin/coupons/`)** và **User (`src/routes/_admin/users/`)**, tuân thủ 100% triết lý UI/UX từ `Newmoon-Admin` và kiến trúc Porto/Apiato Backend.

---

## 📋 CHECKLIST TỰ KIỂM TRÁ BẮT BUỘC KHÔNG ĐƯỢC BỎ BƯỚC (FULL-STACK DEFINITION OF DONE)

Khi phát triển hoặc refactor bất kỳ module CRUD nào (List, Create, Edit), AI Agent **BẮT BUỘC** phải rà soát qua 6 nhóm tiêu chí bên dưới trước khi bàn giao cho anh Hiếu:

```
[ ] 1. BACKEND INTEGRITY: Migration table, Model $fillable, Request rules(), Action sanitizeInput(), Transformer transform()
[ ] 2. FRONTEND INPUT FILTER: Lọc ký tự SĐT (replace /[^0-9]/g), Email regex, Tiền tệ VND không có icon $
[ ] 3. F5 & PERSISTENCE: Post-Save Re-sync (refetch API), List Cache Merge (List View merge cache SĐT/Data), localStorage Column Visibility + Form Cache Fallback
[ ] 4. DOMAIN & DESIGN: 1 Card liền mạch, w-full, CẤM cột ID nội bộ DB thô, Banner Cyan (#EBF7FA) Số La Mã (I, II, III, IV), DateBox DD/MM/YYYY 1 icon
[ ] 5. BRAND COLOR & BADGES: Blue (#2B7FFF / blue-600) chủ đạo, Badge 4 màu chuẩn (Emerald, Rose, Amber, Blue)
[ ] 6. SECURITY GUARDS: Khóa hành động xóa/giáng cấp tài khoản Super Admin root gốc
```

---

## ⚙️ 1. Quy Chuẩn Backend & Database (Full-Stack Backend Integrity)

Khi tạo mới hoặc cập nhật module ở Backend (`app/Containers/AppSection/<Domain>/`):

1. **Migration Schema (`Data/Migrations/`)**:
   * Kiểm tra bảng Database BẮT BUỘC có đầy đủ các cột dữ liệu cần lưu (`phone`, `status`, `effective_from`, `effective_to`, `reason`, `version`...).
   * **NGHIÊM CẤM** thiếu cột trên Database dẫn đến gửi payload từ Frontend mà Backend không thể lưu được.

2. **Model (`Models/<Entity>.php`)**:
   * Mọi cột dữ liệu có thể chỉnh sửa BẮT BUỘC phải nằm trong mảng `$fillable = ['name', 'email', 'phone', 'status', ...];`.

3. **Request Validation (`UI/API/Requests/<Action>Request.php`)**:
   * Khai báo rule kiểm tra chặt chẽ:
     * Số điện thoại: `'phone' => 'nullable|string|regex:/^(0|\+?84)[0-9]{8,10}$/'`
     * Email: `'email' => 'nullable|email'`
     * Trạng thái: `'status' => 'nullable|in:active,inactive'`
     * Ngày tháng: `'birth' => 'nullable|date'`

4. **Action Use-Case (`Actions/<Action>Action.php`)**:
   * Mảng `$request->sanitizeInput([...])` BẮT BUỘC liệt kê đầy đủ TẤT CẢ các trường dữ liệu được phép cập nhật. **NGHIÊM CẤM** bỏ sót trường làm Backend tự động nuốt/bỏ qua dữ liệu Frontend gửi lên.

5. **Transformer Contract (`UI/API/Transformers/<Entity>Transformer.php`)**:
   * Phương thức `transform()` BẮT BUỘC trả về đầy đủ các trường thông tin cho Frontend (`phone`, `status`, `roles`...).

---

## 🛡️ 2. Quy Chuẩn Frontend Filter & Validation (Input Validation)

1. **Lọc Ký Tự Trực Tiếp Trên Ô Nhập (Live Input Filter)**:
   * **Số điện thoại**: BẮT BUỘC lọc sạch các ký tự không phải chữ số ngay khi người dùng gõ:
     `onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })}`.
     $\rightarrow$ Tuyệt đối KHÔNG cho phép người dùng gõ chữ cái (như `ws`, `abc`) hay ký tự đặc biệt vào ô SĐT.
   * **Số tiền tệ / Phần trăm**: Lọc bỏ số âm và chữ cái.

2. **Validation Trước Khi Submit Form**:
   * **Họ tên / Trường bắt buộc**: Kiểm tra `!formData.name.trim()`, hiển thị Toast báo lỗi cụ thể.
   * **Email**: Kiểm tra regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`. Báo lỗi nếu thiếu cú pháp `@domain.com`.
   * **Số điện thoại**: Kiểm tra từ **9 đến 11 chữ số** (bắt đầu bằng `0` hoặc `84`).

---

## 🔄 3. Cơ Chế Lưu Dữ Liệu & Chống Mất State Khi F5 (F5 Persistence Safe)

1. **Post-Save Re-sync (Đồng Bộ State Sau Khi Lưu)**:
   * Ngay sau khi gọi API cập nhật thành công và hiển thị `toast.success(...)`, Frontend BẮT BUỘC thực hiện re-fetch lại dữ liệu mới nhất từ Server (ví dụ `findUserById(id)` / `findCouponById(id)`) và cập nhật lại state `setFormData(...)`.

2. **LocalStorage Cache Fallback (Bảo Vệ Dữ Liệu Khỏi F5)**:
   * **Column Visibility**: Cài đặt ẩn/hiện cột bảng BẮT BUỘC lưu vào `localStorage` (`superdong_<entity>_visible_columns`).
   * **Form Data Cache**: Dữ liệu vừa chỉnh sửa được tự động backup vào `localStorage` (`superdong_<entity>_cache_${id}`). Khi người dùng bấm **F5 (Reload trang)**, hệ thống đọc lại cache để giữ nguyên trạng thái mới nhất $100\%$, không bao giờ bị trôi về dữ liệu cũ.

3. **List View Cache Merge (Đồng Bộ Dữ Liệu Màn Danh Sách)**:
   * Mọi trang Danh Sách (List View) khi fetch mảng dữ liệu từ API BẮT BUỘC phải map-merge với `localStorage` cache fallback (`superdong_<entity>_cache_${id}`) của từng dòng.
   * Điều này đảm bảo khi người dùng vừa chỉnh sửa SĐT (như `0903111221`) ở màn Edit rồi quay lại trang List (hoặc F5), SĐT và mọi thông tin vừa chỉnh sửa BẮT BUỘC phải hiển thị đồng bộ $100\%$, tuyệt đối KHÔNG bị 'Chưa cập nhật'!

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

## 📂 7. Danh Sách File Mẫu Chuẩn Mực (Golden Reference Source Files)

* **Coupon Module**:
  * List: [coupons/index.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/coupons/index.tsx)
  * Create: [coupons/create.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/coupons/create.tsx)
  * Edit: [coupons/$couponId.edit.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/coupons/$couponId.edit.tsx)

* **User Module**:
  * List: [users/index.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/users/index.tsx)
  * Create: [users/create.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/users/create.tsx)
  * Edit: [users/$userId.edit.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/users/$userId.edit.tsx)
