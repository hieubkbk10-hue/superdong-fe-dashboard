---
name: admin-ui-standard
description: Quy chuẩn thiết kế và phát triển giao diện Admin Dashboard (React, TanStack Router, TailwindCSS, Shadcn, Lucide React) chuẩn Newmoon-Admin và Superdong. Sử dụng Module Coupon làm tham chiếu mẫu chuẩn mực cho mọi màn hình List, Create, Edit.
---

# Admin UI Standard - Quy Chuẩn Thiết Kế Giao Diện Superdong Admin Dashboard

Bộ quy chuẩn thiết kế và lập trình Frontend Dashboard được tổng hợp trực tiếp từ module mẫu **Coupon (`src/routes/_admin/coupons/`)**, tuân thủ 100% triết lý UI/UX từ `Newmoon-Admin` và nhận diện thương hiệu Superdong.

---

## 🧠 1. Triết Lý Thiết Kế Cốt Lõi (Design Philosophy)

1. **Đúng Bản Chất Nghiệp Vụ (Domain Model Authenticity)**:
   * Không máy móc đưa các phần tử thuộc tính của đối tượng này sang đối tượng khác (ví dụ: Nhân viên `Employee` có ảnh đại diện nên có khung upload Avatar, nhưng Mã khuyến mãi `Coupon` là chính sách giá nên KHÔNG CÓ khung upload ảnh Avatar).
   * Mọi ô nhập liệu và trường thông tin phải phản ánh đúng dữ liệu nghiệp vụ thực tế.

2. **Nhất Quán Tông Màu Thương Hiệu (Unified Brand Color Palette)**:
   * **Màu Chủ Đạo Thương Hiệu (Primary Brand Color)**: **Tông Xanh Dương (`blue-600` / `#2B7FFF`)**
     * Nút chính (Primary Action Buttons): `bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg`
     * Khung mã code / Highlight badge: `bg-blue-50 text-blue-600 border-blue-200`
     * Icon sắp xếp bảng & active state: `text-blue-600 dark:text-blue-400`
     * Viền focus ring ô nhập liệu: `focus:border-blue-500`

3. **Bố Cục 1 Khung Liền Mạch (Single Unified Card Layout)**:
   * Form Tạo mới và Chỉnh sửa không chia thành nhiều khối lơ lửng rời rạc mà được gom gọn trong **1 khung Card duy nhất** (`bg-white shadow-2xs`).
   * Các phần thông tin được phân nhóm bằng **Thanh Banner màu Cyan nhạt chuẩn Newmoon-Admin (`bg-[#EBF7FA]`)** có dán Số La Mã (`I.`, `II.`, `III.`, `IV.`).

4. **Trải Rộng Toàn Bộ Chiều Rộng & Nhất Quán Spacing**:
   * Sử dụng `w-full` trải rộng toàn bộ khung hình, loại bỏ `max-w-4xl` gây thừa khoảng trắng.
   * Kích thước chữ ô nhập liệu chuẩn `text-sm h-9`, khoảng cách dính sát gọn gàng (`space-y-3` / `gap-3.5`).

---

## 🔽 2. Đầy Đủ Danh Sách Dropdown & Controls Trong Màn Hình CRUD

Mọi màn hình CRUD tiêu chuẩn BẮT BUỘC có đầy đủ các bộ điều khiển Dropdown và Control sau:

### 2.1. Dropdown Trong Màn Hình Danh Sách (List Page - `index.tsx`)

1. **SearchInput (Ô Tìm Kiếm Có Icon Kính Lúp)**:
   * Vị trí: Đầu thanh Filter Bar.
   * Tự động lọc dữ liệu theo từ khóa tìm kiếm (mã hoặc tên).

2. **Filter Select Dropdown (Lọc Trạng Thái / Danh Mục)**:
   * Vị trí: Bên cạnh ô tìm kiếm.
   * Tùy chọn tiêu chuẩn: `Tất cả trạng thái`, `Kích hoạt`, `Đã khóa`.
   * Thể hiện: `<select className="h-9 px-3 text-[13px] border border-slate-200 rounded-md bg-white">`.

3. **Column Visibility Toggle Dropdown (Ẩn / Hiện Cột)**:
   * Vị trí: Góc phải thanh Filter Bar (`SlidersHorizontal` icon).
   * Tính năng: Popup danh sách checkbox bật/tắt hiển thị từng cột + Link `Mặc định` reset cấu hình.
   * **BẮT BUỘC Persistence `localStorage`**: Mọi thay đổi ẩn/hiện cột phải lưu tự động vào `localStorage` (`superdong_<entity>_visible_columns`) để khi bấm **F5 (Reload)** không bị mất cài đặt.

4. **Pagination Rows Per Page Dropdown (Số Dòng / Trang)**:
   * Vị trí: Thanh phân trang `<PaginationBar>`.
   * Tùy chọn: `5`, `10`, `20`, `50` dòng/trang.

5. **Row Actions (Dropdown / Button Hành Động Từng Dòng)**:
   * Nút icon trực tiếp: `Pen` (Sửa - hover xanh `text-blue-600 bg-blue-50`) & `Trash2` (Xóa - hover đỏ `text-rose-600 bg-rose-50`).
   * Nếu có từ 3 hành động trở lên, dùng `<DropdownMenu>` icon 3 dấu chấm (`MoreHorizontal`).

### 2.2. Controls Trong Màn Hình Tạo Mới & Chỉnh Sửa (Edit / Create Forms)

1. **Discount Type Select Dropdown (Loại Giảm Giá)**:
   * Tùy chọn: `Theo Phần Trăm (%)` hoặc `Số Tiền Cố Định (VND)`.

2. **DateBox Control (Ô Chọn Ngày Chuẩn Newmoon)**:
   * Sử dụng `<DateBox>` ([DateBox.tsx](file:///E:/cty/superdong-fe-dashboard/src/components/common/DateBox.tsx)).
   * Hiển thị văn bản ngày Việt Nam `DD/MM/YYYY` (ví dụ: `01/06/2026`).
   * Chứa đúng **1 Icon Lịch duy nhất (`CalendarIcon`)** bên góc phải, kích hoạt chọn ngày mượt mà khi nhấp vào.

3. **Status Checkbox / Toggle (Trạng Thái Kích Hoạt)**:
   * Checkbox `Kích hoạt sử dụng mã coupon ngay lập tức`.

---

## 📊 3. Quy Chuẩn Cấu Trúc Bảng Dữ Liệu (`<DataTable>`)

1. **Header Bảng (`TableHeader`)**:
   * Chữ in hoa, font bold (`text-slate-600 uppercase text-[12px] font-bold`), nền xám nhạt `#F9FAFB`.
   * Các cột phân tách bằng đường kẻ dọc mỏng (`border-r border-slate-200/80`).

2. **Sắp Xếp 3 Trạng Thái (3-State Sorting)**:
   * Click 1 $\rightarrow$ Tăng dần (`asc`), Click 2 $\rightarrow$ Giảm dần (`desc`), Click 3 $\rightarrow$ Trở về ban đầu (`none`).

3. **Định Dạng Ô Dữ Liệu (Cell Formatting)**:
   * **Mã Code**: Font mono `text-blue-600 bg-blue-50 border-blue-200 px-2 py-0.5 rounded`.
   * **Tiền Tệ / phần trăm**: Tiền tệ VND dùng `formatCurrency` sạch không dùng icon $ (`Giảm 100.000 đ`), phần trăm dùng `Percent` icon (`Giảm 15%`).
   * **Hạn Dùng**: Icon `Calendar` kèm định dạng `YYYY-MM-DD ➔ YYYY-MM-DD`.
   * **Trạng Thái**: Badge `<Badge variant="success">` (`CheckCircle2`) cho Kích hoạt, `<Badge variant="danger">` (`XCircle`) cho Đã khóa.

4. **Trạng Thái Loading & Empty**:
   * Tải dữ liệu: 5 dòng Skeleton loading animation (`<Skeleton className="h-5 w-full">`).
   * Không có dữ liệu: Icon `Inbox` kèm thông báo rỗng.

---

## 📝 4. Cấu Trúc Form Mẫu Chuẩn Mực (Standard Form Structure)

```tsx
<form className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
  
  {/* SECTION 1 */}
  <div className="space-y-3">
    <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
      I. Thông tin cơ bản
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      {/* Inputs */}
    </div>
  </div>

  {/* SECTION 2 */}
  <div className="space-y-3">
    <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
      II. Mức giảm giá & Điều kiện áp dụng
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
      {/* Inputs */}
    </div>
  </div>

  {/* SECTION 3 */}
  <div className="space-y-3">
    <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
      III. Thời hạn & Giới hạn sử dụng
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      {/* Usage limit, Valid from DateBox, Valid until DateBox */}
    </div>
  </div>

  {/* SECTION 4 */}
  <div className="space-y-3">
    <div className="bg-[#EBF7FA] dark:bg-slate-900/80 px-3.5 py-2 rounded-lg text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide border border-blue-100 dark:border-slate-800">
      IV. Trạng thái & Lý do điều chỉnh
    </div>
    <div className="space-y-3">
      {/* Reason & Is Active Checkbox */}
    </div>
  </div>

  {/* BOTTOM ACTION BAR */}
  <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
    <Button variant="outline" type="button" className="px-5 h-9 text-xs">Hủy Bỏ</Button>
    <Button type="submit" variant="primary" className="px-6 h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
      Lưu thay đổi
    </Button>
  </div>
</form>
```

---

## 🛠️ 5. Danh Sách Common Components Chuẩn (Golden Component Registry)

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
