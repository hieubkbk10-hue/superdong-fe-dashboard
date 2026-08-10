---
name: admin-ui-standard
description: Quy chuẩn thiết kế và phát triển giao diện Admin Dashboard (React, TanStack Router, TailwindCSS, Shadcn, Lucide React) chuẩn Newmoon-Admin và Superdong. Sử dụng Module Coupon làm tham chiếu mẫu chuẩn mực cho mọi màn hình List, Create, Edit.
---

# Admin UI Standard - Quy Chuẩn Thiết Kế Giao Diện Superdong Admin Dashboard

Bộ quy chuẩn thiết kế và lập trình Frontend Dashboard được tổng hợp trực tiếp từ module mẫu **Coupon (`src/routes/_admin/coupons/`)**, tuân thủ 100% triết lý UI/UX từ `Newmoon-Admin` và nhận diện thương hiệu Superdong.

---

## 🎨 1. Quy Chuẩn Màu Sắc & Thương Hiệu (Brand Theme)

* **Màu Chủ Đạo Thương Hiệu (Primary Brand Color)**: **Tông Xanh Dương (`blue-600` / `#2B7FFF`)**
  * Nút bấm chính (Primary Action Buttons): `bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg`
  * Khung mã code / Highlight badge: `bg-blue-50 text-blue-600 border-blue-200`
  * Icon sắp xếp bảng & active state: `text-blue-600 dark:text-blue-400`
  * Viền focus ring ô nhập liệu: `focus:border-blue-500`

* **Màu Trạng Thái Chuẩn (Status Palette)**:
  * **Success (Kích hoạt / Đã thanh toán / Hoàn thành)**: `bg-emerald-50 text-emerald-700 border-emerald-200`
  * **Danger (Khóa / Xóa / Thất bại)**: `bg-rose-50 text-rose-700 border-rose-200`
  * **Warning (Cảnh báo / Chờ duyệt)**: `bg-amber-50 text-amber-700 border-amber-200`
  * **Blue / Primary (Mã mới / Đang xử lý)**: `bg-blue-50 text-blue-700 border-blue-200`

---

## 🔽 2. Các Dropdown Bắt Buộc Trong Một Trang CRUD List

Một màn hình danh sách CRUD tiêu chuẩn BẮT BUỘC có đầy đủ 4 loại Dropdown sau:

1. **Filter Dropdown (Lọc Trạng Thái / Danh Mục)**:
   * Vị trí: Trên thanh Filter Bar, bên cạnh ô tìm kiếm `<SearchInput>`.
   * Sử dụng: `<select className="h-9 px-3 text-[13px] border border-slate-200 rounded-md bg-white">`.
   * Tùy chọn tiêu chuẩn: `Tất cả trạng thái`, `Kích hoạt`, `Đã khóa`.

2. **Column Visibility Toggle Dropdown (Ẩn / Hiện Cột)**:
   * Vị trí: Góc phải thanh Filter Bar (`SlidersHorizontal` icon).
   * Tính năng: Popup chứa danh sách checkbox bật/tắt hiển thị từng cột dữ liệu + Nút `Mặc định` reset cấu hình.
   * **BẮT BUỘC Persistence `localStorage`**: Mọi cài đặt ẩn/hiện cột phải tự động lưu vào `localStorage` (`superdong_<entity>_visible_columns`) để khi bấm **F5 (Reload)** không bao giờ bị reset về mặc định!

3. **Rows Per Page Dropdown (Số Dòng Trên Trang)**:
   * Vị trí: Góc trái của thanh phân trang `<PaginationBar>`.
   * Tùy chọn số dòng: `5`, `10`, `20`, `50` dòng/trang.

4. **Row Actions (Hành Động Từng Dòng)**:
   * Dùng bộ nút icon trực tiếp: `Pen` (Chỉnh sửa - hover màu xanh dương `text-blue-600 bg-blue-50`) & `Trash2` (Xóa - hover màu đỏ `text-rose-600 bg-rose-50`).
   * Nếu có từ 3 hành động trở lên, bọc trong `<DropdownMenu>` dạng icon 3 dấu chấm (`MoreHorizontal`).

---

## 📊 3. Quy Chuẩn Cấu Trúc Bảng Dữ Liệu (`<DataTable>`)

Bảng dữ liệu trong màn hình CRUD BẮT BUỘC tuân thủ các quy tắc hiển thị sau:

1. **Header Bảng (TableHeader)**:
   * Chữ in hoa, font bold (`text-slate-600 uppercase text-[12px] font-bold`), nền xám nhạt `#F9FAFB`.
   * Các cột phân tách bằng đường kẻ dọc mỏng (`border-r border-slate-200/80`).

2. **Sắp Xếp 3 Trạng Thái (3-State Sorting)**:
   * Hỗ trợ sắp xếp cho các cột tiêu chuẩn (Mã, Tên, Giá trị, Hạn dùng, Trạng thái).
   * **Quy trình 3 phát click**: Click 1 $\rightarrow$ Tăng dần (`asc` icon mũi tên lên sáng xanh), Click 2 $\rightarrow$ Giảm dần (`desc` icon mũi tên xuống sáng xanh), Click 3 $\rightarrow$ Trở về ban đầu (`none`).

3. **Quy Chuẩn Định Dạng Dữ Liệu Trong Cột (Cell Formatting)**:
   * **Mã ID / Code**: Dùng `font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200`.
   * **Giá Trị Tiền / Phần Trăm**: Tiền tệ VND dùng `formatCurrency` sạch sẽ không dùng icon $ (`Giảm 100.000 đ`), phần trăm dùng `Percent` icon (`Giảm 15%`).
   * **Hạn Dùng**: Icon `Calendar` kèm định dạng `YYYY-MM-DD ➔ YYYY-MM-DD`.
   * **Trạng Thái**: Dùng `<Badge variant="success">` kèm icon `CheckCircle2` cho Kích hoạt, `<Badge variant="danger">` kèm icon `XCircle` cho Đã khóa.

4. **Trạng Thái Tải & Rỗng (Loading & Empty States)**:
   * Đang tải: Hiển thị 5 dòng Skeleton loading animation (`<Skeleton className="h-5 w-full">`).
   * Không có dữ liệu: Hiển thị icon `Inbox` kèm thông báo rỗng ngắn gọn.

---

## 📝 4. Quy Chuẩn Màn Hình Tạo Mới & Chỉnh Sửa (Create & Edit Form Architecture)

Mọi màn hình Form (ví dụ: `coupons/create.tsx` và `coupons/$couponId.edit.tsx`) BẮT BUỘC tuân thủ:

### 4.1. Khung Tràn Chiều Rộng Full-Width (`w-full`)
* Không dùng `max-w-4xl` gây hẹp khung. Sử dụng `w-full` kết hợp `space-y-4` để form mở rộng toàn bộ màn hình.

### 4.2. Cấu Trúc Form 1 Khung Card Liền Mạch (Single Unified Card Container)
* Toàn bộ form nằm trong 1 khung duy nhất: `bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5`.
* Các phần thông tin được phân nhóm bằng **Thanh Banner màu Cyan nhạt chuẩn Newmoon-Admin (`bg-[#EBF7FA]`)**:
  * `I. THÔNG TIN CƠ BẢN`
  * `II. MỨC GIẢM GIÁ & ĐIỀU KIỆN ÁP DỤNG`
  * `III. THỜI HẠN & GIỚI HẠN SỬ DỤNG`
  * `IV. TRẠNG THÁI & LÝ DO ĐIỀU CHỈNH`

### 4.3. Quy Chuẩn Cụm Ô Nhập Liệu (Form Controls)
* **Kích thước chữ**: Nhãn `text-xs font-semibold text-slate-700`, giá trị nhập `text-sm h-9 rounded-lg bg-white border-slate-200`.
* **Dấu sao đỏ bắt buộc**: Các trường bắt buộc phải có `<span className="text-rose-500 font-bold">*</span>`.
* **Lưới ô nhập liệu (Grid System)**:
  * Thông tin cơ bản: Lưới 2 cột (`grid grid-cols-2`).
  * Điều kiện áp dụng: Lưới 4 cột (`grid grid-cols-4`).
  * Thời hạn & Giới hạn: Lưới 3 cột (`grid grid-cols-3`).

### 4.4. Component Ô Chọn Ngày (`<DateBox>`)
* Tuyệt đối KHÔNG dùng ô date gốc thô xấu của trình duyệt gây trùng icon.
* Sử dụng `<DateBox>` ([DateBox.tsx](file:///E:/cty/superdong-fe-dashboard/src/components/common/DateBox.tsx)):
  * Hiển thị chữ định dạng ngày Việt Nam chuẩn `DD/MM/YYYY` (ví dụ: `01/06/2026`).
  * Chứa đúng **1 Icon Lịch duy nhất (`CalendarIcon`)** bên góc phải.
  * Tự động kích hoạt bộ chọn ngày mượt mà khi nhấp vào.

### 4.5. Thanh Nút Bấm Hành Động Dưới Cùng (Bottom Floating Action Bar)
* Nút `Hủy Bỏ` (`Button variant="outline" className="px-5 h-9 text-xs"`) ở bên trái nút lưu.
* Nút `Lưu thay đổi` / `Tạo mới` (`Button variant="primary" className="px-6 h-9 text-xs bg-blue-600 hover:bg-blue-700"`) ở ngoài cùng bên phải, có hiệu ứng spinner khi đang `isSubmitting`.

---

## 🛠️ 5. Danh Sách Common Components Chuẩn (Golden Component Registry)

Tất cả các màn hình mới khi phát triển BẮT BUỘC tái sử dụng các component chuẩn tại `src/components/common/`:

| Component | Đường dẫn File | Mục đích sử dụng |
| :--- | :--- | :--- |
| **`Button`** | [Button.tsx](file:///E:/cty/superdong-fe-dashboard/src/components/common/Button.tsx) | Nút bấm chuẩn với các variant `primary` (Blue), `light`, `outline`, `ghost`, `danger` |
| **`Badge`** | [Badge.tsx](file:///E:/cty/superdong-fe-dashboard/src/components/common/Badge.tsx) | Nhãn trạng thái `success`, `danger`, `warning`, `blue`, `secondary` |
| **`DateBox`** | [DateBox.tsx](file:///E:/cty/superdong-fe-dashboard/src/components/common/DateBox.tsx) | Ô chọn ngày hiển thị dạng `DD/MM/YYYY` kèm 1 icon lịch duy nhất |
| **`DataTable`** | [DataTable.tsx](file:///E:/cty/superdong-fe-dashboard/src/components/common/DataTable.tsx) | Bảng dữ liệu hỗ trợ sắp xếp 3 trạng thái, skeleton loading & ẩn/hiện cột |
| **`PaginationBar`** | [PaginationBar.tsx](file:///E:/cty/superdong-fe-dashboard/src/components/common/PaginationBar.tsx) | Thanh điều hướng phân trang và chọn số dòng/trang |
| **`SearchInput`** | [SearchInput.tsx](file:///E:/cty/superdong-fe-dashboard/src/components/common/SearchInput.tsx) | Ô tìm kiếm từ khóa dùng chung có icon kính lúp |
| **`ConfirmModal`** | [ConfirmModal.tsx](file:///E:/cty/superdong-fe-dashboard/src/components/common/ConfirmModal.tsx) | Dialog xác nhận hành động nguy hiểm (xóa/khóa dữ liệu) |

---

## 📂 6. Danh Sách File Mẫu Chuẩn Mực (Golden Reference Source Files)

* **Danh Sách (List View)**: [coupons/index.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/coupons/index.tsx)
* **Tạo Mới (Create Form)**: [coupons/create.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/coupons/create.tsx)
* **Chỉnh Sửa (Edit Form)**: [coupons/$couponId.edit.tsx](file:///E:/cty/superdong-fe-dashboard/src/routes/_admin/coupons/$couponId.edit.tsx)
