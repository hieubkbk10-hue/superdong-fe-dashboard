# QUY CHUẨN CODING & KIẾN TRÚC DỰ ÁN

## (Dành cho Đội ngũ Phát triển)

Tài liệu này hệ thống hóa các quy chuẩn, phong cách viết code và cấu trúc thư mục được áp dụng thống nhất.

---

## 1. NGUYÊN TẮC CỐT LÕI (CORE PRINCIPLES)

### 1.1. TypeScript Strict Typing (Nghiêm cấm kiểu `any`)

- **Tuyệt đối KHÔNG sử dụng `any`:** Khi viết code bằng TypeScript, không được lạm dụng kiểu `any`. Việc sử dụng `any` sẽ làm mất đi khả năng kiểm soát lỗi tĩnh của TypeScript.
- **Giải pháp thay thế:**
  - Sử dụng `unknown` đối với dữ liệu động hoặc chưa rõ cấu trúc từ trước. Thực hiện kiểm tra kiểu (Type Narrowing) bằng các toán tử như `typeof`, `instanceof`, hoặc toán tử `in` trước khi xử lý dữ liệu.
  - **Quy chuẩn mở rộng Interface:** Khi một component hoặc API cần gán thêm các trường dữ liệu tùy biến cho một đối tượng cốt lõi (ví dụ: gắn thêm `boardStatuses` vào đối tượng `Work` để phục vụ UI), tránh sử dụng ép kiểu cưỡng chế như `(obj as any).property = value` hoặc viết thêm wrapper kế thừa. Hãy bổ sung trực tiếp thuộc tính đó dưới dạng **optional** (`?`) vào interface gốc trong file `.types.ts` tương ứng.
  - **Quy chuẩn API Response (RTK Query):** Trong hàm `transformResponse`, không được khai báo kiểu tham số `response` là `any`. Hãy khai báo kiểu rõ ràng từ API interface. Nếu cần thiết phải thay đổi kiểu dữ liệu, hãy ép kiểu trung gian thông qua `unknown` hoặc sử dụng các cơ chế thu hẹp kiểu an toàn.
  - **Khai báo kiểu cho tham số động (RTK Query):** Tránh khai báo tham số động dưới dạng `Record<string, any>`. Hãy sử dụng `Record<string, string | number>` hoặc định nghĩa cụ thể union type của tham số để đảm bảo tính an toàn kiểu dữ liệu và serialization chuẩn xác.
  - **Trích xuất kiểu từ Thư viện thứ 3:** Khi thư viện không export trực tiếp kiểu dữ liệu của props hoặc callback, tuyệt đối không dùng `any`. Hãy sử dụng tiện ích `Parameters<typeof Component>` hoặc tương đương để lấy đúng kiểu dữ liệu.
    - _Ví dụ:_ `onChange={handleDateClick as Parameters<typeof Calendar>[0]['onChange']}`
  - **Consolidate Types (Nhất quán kiểu):** Không khai báo interface dùng chung cho nhiều component tại từng file component riêng lẻ. Định nghĩa tất cả các kiểu dữ liệu dùng chung tại thư mục gốc `@/types/` (ví dụ: `src/types/common.ts`) để tránh trôi lệch schema (Schema Drift).

### 1.2. Tiêu chuẩn đặt tên (English-as-Identifier)

- **Mã nguồn viết hoàn toàn bằng tiếng Anh:** Tất cả định danh (tên biến, hằng số, tên state, hàm, class, tên file) bắt buộc phải viết bằng **tiếng Anh**, bất kể phần giao diện người dùng hiển thị ngôn ngữ nào.
- **Quy chuẩn đặt tên State UI:** Đối với các biến state kiểu Boolean dùng để đóng/mở hoặc hiển thị giao diện, bắt buộc tuân theo quy tắc: **`is[Feature][State]`**.
  - _Ví dụ tốt:_ `isOverviewOpen`, `isFilterVisible`, `isUncategorizedExpanded`.
  - _Tránh:_ `isOpenOverview`, `showFilter`, hay đặt tên tiếng Việt.

### 1.3. Định dạng code (Code Formatting)

- **Indentation:** Thống nhất sử dụng thụt lề **2-space** trên toàn bộ dự án thông qua cấu hình `.prettierrc` và `.editorconfig`.
- **Công cụ định dạng:** `Prettier` là công cụ định dạng bắt buộc. Mọi dự án phải cài đặt `prettier` dưới dạng `devDependency` cục bộ để đảm bảo script `npm run format` hoạt động trơn tru.
- **Quy chuẩn EditorConfig:** Đặt `indent_size = 2` để đảm bảo tính nhất quán trên mọi IDE của các thành viên trong đội ngũ.

---

## 2. QUY CHUẨN HOOKS & QUẢN LÝ STATE TRONG REACT

### 2.1. Ngăn ngừa render chồng chéo (The `setState`-in-Effect Guard)

- **Vấn đề:** Việc gọi `setState` đồng bộ bên trong `useEffect` sẽ kích thích một lượt render phụ ngay lập tức, làm giảm đáng kể hiệu năng ứng dụng.
- **Giải pháp:** Ưu tiên sử dụng trạng thái phái sinh (derived state) từ props/state hiện tại hoặc khởi tạo state chính xác ngay từ đầu.
- **Quy tắc "Silent Sync":** Trong trường hợp bất khả kháng phải đồng bộ hóa dữ liệu bất đồng bộ từ props/store vào state cục bộ (chẳng hạn như điền dữ liệu trước vào form biểu mẫu), hãy đảm bảo thực hiện kiểm tra thay đổi giá trị trước khi `setState` hoặc sử dụng comment bỏ qua linter một cách hạn chế:
  ```typescript
  useEffect(() => {
    if (data && data !== localItems) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalItems(data);
    }
  }, [data]);
  ```

### 2.2. Trích xuất Component tĩnh (Static Component Extraction)

- **Vấn đề:** Định nghĩa một sub-component hoặc helper component bên trong thân của một component cha sẽ làm sub-component bị hủy và khởi tạo lại ở mỗi lần component cha render. Việc này làm mất hoàn toàn state cục bộ của sub-component và vi phạm quy tắc Hooks của React.
- **Giải pháp:** Luôn khai báo các helper component ở bên ngoài hàm component chính, hoặc chuyển chúng sang các file độc lập. Truyền các state cần thiết thông qua props.

---

## 3. THIẾT KẾ UI, LAYOUT & TƯƠNG TÁC (UI & LAYOUT STANDARDS)

### 3.1. Cấu trúc bảng và Layout mật độ cao

- **HTML Tables:** Ưu tiên sử dụng thẻ `<table>` truyền thống với thuộc tính `table-layout: fixed` đối với các màn hình danh sách dữ liệu có mật độ cao (tabular views). Điều này giúp căn chỉnh cột ổn định khi hiển thị dữ liệu phân cấp phức tạp và hỗ trợ sticky headers hiệu quả thông qua thẻ `<colgroup>`.
- **Cảnh báo:** Tuyệt đối tránh sử dụng thuộc tính CSS `display: contents` cho các cấu trúc lưới phức tạp vì nó gây ra các lỗi nghiêm trọng về khả năng tiếp cận (accessibility) và hiển thị sai lệch cột trên các trình duyệt khác nhau.

### 3.2. Cấu trúc Dialog & Popover (Radix UI / Shading)

- **Tránh lồng nút bấm (Nested Buttons):** Theo chuẩn HTML5, thẻ `<button>` không được phép là con của một thẻ `<button>` khác.
- **Thuộc tính `asChild`:** Các thành phần trigger của Radix UI (như `PopoverTrigger`, `TooltipTrigger`, `DialogTrigger`) mặc định kết xuất ra thẻ `<button>`. Do đó, khi các trigger này bọc ngoài một nút bấm khác, bắt buộc phải khai báo thuộc tính **`asChild`** để Slot tự động gộp các thuộc tính mà không tạo ra các thẻ button lồng nhau gây lỗi Hydration.
- **Lồng ghép nhiều Trigger:** Khi một phần tử vừa có tooltip vừa có popover, hãy sắp xếp lồng nhau theo thứ tự sau để các thuộc tính ARIA và bộ lắng nghe sự kiện được chuyển tiếp chuẩn xác xuống phần tử thật:
  ```tsx
  <PopoverTrigger asChild>
    <TooltipTrigger asChild>
      <button>Click me</button>
    </TooltipTrigger>
  </PopoverTrigger>
  ```

### 3.3. Quản lý Z-Index Stack

Để ngăn chặn các thành phần nổi (modal, popover, image viewer) đè lên nhau hoặc bị che khuất một cách hỗn loạn, dự án áp dụng hệ thống phân lớp Z-Index cố định:

1.  **Các thành phần giao diện thông thường (Dropdown, Popover cục bộ):** Cố định ở mức **`z-[1000]`** để vượt qua khung sườn layout thông thường nhưng vẫn nằm dưới modal lớn.
2.  **Khung hội thoại chính (Dialog Content):** Cố định ở mức **`z-[10000]`**.
3.  **Khung trình chiếu hoặc Overlay toàn cục (File/Image Viewer):** Cố định ở mức cao hơn: Backdrop (`z-[1050]`) và Content (`z-[1060]`).

> [!IMPORTANT]
> **Quy chuẩn tương tác Modal nối tiếp (Sequential Modal Transition):**
> Khi người dùng mở một cửa sổ trình xem ảnh/file từ bên trong một Dialog, hãy đóng Dialog cha ngay lập tức (`onClose()`). Sau khi tắt trình xem ảnh, hãy kích hoạt mở lại Dialog cha nếu người dùng cần tiếp tục ngữ cảnh làm việc. Không để hai tầng modal lớn hoạt động song song để tránh xung đột tiêu điểm bàn phím và lỗi hiển thị.

---

## 4. QUY TRÌNH BẤT ĐỒNG BỘ & XỬ LÝ LỖI (ASYNC & ERROR RESILIENCE)

### 4.1. Quy định sử dụng Realtime (Realtime Synchronization Guidelines)

- **Mô hình Realtime-Primary Sync (Đồng bộ Realtime là chính):** Tuyệt đối không cập nhật lại Redux từ kết quả phản hồi của API mutation khi đã có event Realtime để tránh lỗi "Double Dispatch" gây nhấp nháy UI (UI Jitter) hoặc tranh chấp dữ liệu (Race Condition).
  - _Luồng chuẩn:_ Thao tác người dùng -> Dispatch Optimistic Update lên Redux -> Gọi API -> Server lưu trữ & Broadcast qua WebSocket -> Bộ lắng nghe socket (Realtime hook) cập nhật dữ liệu chuẩn xác lên Redux (Canonical Update).
- **Phân tách luồng thao tác (User-Initiated vs Realtime-Initiated):**
  - Bộ lắng nghe sự kiện socket chỉ được phép dispatch trực tiếp các action cập nhật store của Redux Slice (ví dụ: `dispatch(updateMyTask(...))`), tuyệt đối không gọi các phương thức hook dùng cho thao tác người dùng (ví dụ: `myTask.updateTask()`) để tránh vòng lặp gọi API vô tận.
  - Các hàm xử lý realtime phải được bao bọc trong `useCallback` và bao gồm `dispatch` trong mảng dependency.
- **Xử lý Payload không đồng nhất (Reactive Heterogeneous Payload):**
  - Đối với các sự kiện có cấu trúc payload khác nhau (ví dụ: sự kiện xóa chỉ trả về ID phẳng, sự kiện tạo mới trả về đối tượng lồng `{ work: object }`), bắt buộc phải có các chốt kiểm tra sự tồn tại (Existence Guards).
  - Luôn kiểm tra khóa: Ưu tiên dùng trường đối tượng trước (`payload.work`), nếu không có thì tìm thuộc tính ID (`payload.work_id` hoặc `payload.id`). Bắt buộc cast tất cả ID về kiểu chuỗi (string) trước khi dispatch lên Redux.
- **Cập nhật một phần dữ liệu an toàn (Selective Merging / Partial Update Protection):**
  - Nghiêm cấm dùng spread thô `{ ...existing, ...payload }` khi cập nhật thực thể từ socket patch, tránh ghi đè các trường dữ liệu hợp lệ khác thành `undefined`.
  - Sử dụng kiểm tra kiểm soát thông qua `Object.keys` để chỉ cập nhật các trường được truyền về và bỏ qua các trường `undefined`.
- **Quản lý kết nối và Hàng đợi phòng (Room Management & Lifecycle):**
  - Chỉ kích hoạt kết nối WebSocket và join room sau khi thông tin người dùng và workspace được tải đầy đủ.
  - Sử dụng cơ chế hàng đợi phòng ẩn (Implicit Room Queuing) để lưu trữ các yêu cầu join room nếu socket chưa kết nối xong, tự động gửi đi ngay khi kết nối thành công.

### 4.2. Xử lý lỗi toàn cục và phục hồi ứng dụng

- **Sử dụng AppErrorBoundary:** Sử dụng `react-error-boundary` bao quanh các trang lớn và các widget độc lập để cô lập lỗi hiển thị. Tránh việc một lỗi JavaScript nhỏ tại một widget làm sập toàn bộ ứng dụng.
- **Cơ chế Phục hồi:** Giao diện lỗi (Fallback UI) luôn phải cung cấp nút "Tải lại trang" (sử dụng `window.location.reload()`) để xóa sạch bộ nhớ tạm bị hỏng và tải lại trạng thái ứng dụng một cách an toàn nhất.
- **Sử dụng Null/Undefined Guards:** Luôn chủ động sử dụng toán tử Optional Chaining (`?.`) và Nullish Coalescing (`??`) khi truy xuất các thuộc tính sâu từ API payload, ngăn chặn tối đa lỗi `Cannot read property of undefined` gây crash màn hình.

---

## 5. CẤU TRÚC THƯ MỤC & TỔ CHỨC MODULE (DIRECTORY HYGIENE)

### 5.1. Tổ chức hệ thống Type (`src/types/`)

- **Đuôi mở rộng bắt buộc:** Tất cả các file định nghĩa kiểu dữ liệu trong `src/types/` bắt buộc phải sử dụng phần mở rộng là **`.types.ts`** (ví dụ: `auth.types.ts`, `board.types.ts`).
- **Quy chuẩn đặt tên:** Đặt tên file bằng chữ viết thường hoặc camelCase (ví dụ: `localeData.types.ts`). Tuyệt đối không đặt tên file bắt đầu bằng chữ hoa để tránh lỗi phân biệt chữ hoa/chữ thường khi build trên các nền tảng hệ điều hành khác nhau (như CI/CD chạy Linux vs máy cá nhân chạy Windows).
- **Tệp chỉ mục trung tâm (`index.ts`):** Thư mục `src/types/` phải có file `index.ts` để re-export toàn bộ kiểu dữ liệu của các file bên trong:
  ```typescript
  export * from './auth.types';
  export * from './board.types';
  ```
- **Quy chuẩn Import:** Các thành phần bên ngoài chỉ được phép import kiểu dữ liệu thông qua đường dẫn alias đại diện `@/types`. Nghiêm cấm import trực tiếp từ file con.
  - _Đúng:_ `import { User } from "@/types";`
  - _Sai:_ `import { User } from "@/types/auth.types";`

### 5.2. Tổ chức Tiện ích & Redux Store

Áp dụng cơ chế xuất khẩu đầu mối (Barrel Export Pattern) tương tự cho thư mục tiện ích (`src/utils/`) và store (`src/store/slices/`).

- File `src/utils/index.ts` và `src/store/slices/index.ts` là đầu mối duy nhất cho các import bên ngoài.
- **Lưu ý với Default Export:** Khi một module sử dụng `export default` (ví dụ: `logger.ts`), toán tử `export *` thông thường sẽ bỏ qua export mặc định này. Lập trình viên phải re-export tường minh theo một trong hai cách:
  - _Cách A:_ `export { default as Logger } from "./logger";`
  - _Cách B (Khuyến khích):_ Chuyển đổi file gốc sang sử dụng Named Export thay vì Default Export để tối ưu hóa khả năng gợi nhắc code (autocomplete).

### 5.3. Quy tắc Barrel Import Nghiêm ngặt (Strict Barrel Import Mandate)

Để ngăn ngừa triệt để lỗi vòng lặp phụ thuộc (**Require Cycles / Circular Dependencies**), đội ngũ phát triển phải tuân thủ hai quy tắc sau:

1.  **Consumer Mandate (Bên ngoài import vào):** Các file bên ngoài thư mục bắt buộc phải import thông qua file index hoặc alias đại diện của thư mục đó (không import sâu).
2.  **Internal Restriction (Nội bộ import lẫn nhau):** Các file nằm bên trong cùng một thư mục (ví dụ: `A.tsx` và `B.tsx` nằm trong `src/components/common/`) **TUYỆT ĐỐI KHÔNG** import từ file index của chính thư mục đó (`index.ts` hoặc `@/components/common`).
    - _Sai:_ `import { Button } from "@/components/common";` (trong file `src/components/common/CustomForm.tsx`).
    - _Đúng:_ Hãy sử dụng import tương đối trực tiếp tới file anh em: `import { Button } from "./Button";`.
    - _Hệ quả nếu vi phạm:_ Tạo ra vòng lặp require (`index.ts` -> `CustomForm.tsx` -> `index.ts`), dẫn đến các thành phần export ra bị `undefined` tại thời điểm chạy và gây ra lỗi trắng trang hoặc lỗi `TypeError: Cannot read property 'displayName' of undefined` trên ứng dụng di động.

---

## 6. QUY TRÌNH HẠN CHẾ VÀ ĐÓNG TÍNH NĂNG (FEATURE GATING RITUAL)

- **Tuyệt đối không sử dụng biểu thức Boolean tĩnh trong JSX để tắt tính năng:** Nghiêm cấm sử dụng cấu trúc `{false && <Component />}` trong mã nguồn JSX để ẩn tạm thời tính năng. Cấu trúc này sẽ kích hoạt cảnh báo ESLint nghiêm ngặt `no-constant-binary-expression` và bị chặn khi build production.
- **Phương pháp được chấp nhận:**
  - Sử dụng khối comment của JSX: `{/* <Component /> */}` để vô hiệu hóa hoàn toàn khối giao diện.
  - Sử dụng cờ cấu hình động hoặc biến môi trường nếu tính năng cần bật/tắt linh hoạt.
- **Quy chuẩn dọn dẹp mã nguồn mồ côi (The Cleanup Mandate):** Khi một tính năng hoặc component bị đóng lại bằng comment hoặc cờ cấu hình, lập trình viên bắt buộc phải dọn dẹp (comment hoặc xóa bỏ) toàn bộ các khai báo state liên quan, các hook `useEffect` phụ thuộc, và các import không còn sử dụng. Điều này giúp ngăn chặn các cảnh báo biến không sử dụng (`no-unused-vars`) làm gián đoạn tiến trình build hệ thống.

---

## 7. QUY CHUẨN COMMENT NGHIỆP VỤ (SEMANTIC LOGIC COMMENTING)

Khi viết các xử lý logic phức tạp, có sự phụ thuộc sâu sắc vào trạng thái hoặc phân quyền người dùng, lập trình viên phải ghi chú rõ ràng bằng các tiền tố chuẩn hóa để hỗ trợ các thành viên khác đọc hiểu mã nguồn nhanh chóng:

- **`// QUYỀN:`** Dùng để giải thích các điều kiện phân quyền, kiểm tra vai trò người dùng (ví dụ: chỉ người tạo mới được sửa).
- **`// LOGIC:`** Dùng để giải thích các thuật toán xử lý dữ liệu phức tạp hoặc các trường hợp xử lý đặc biệt từ API.
- **`// UI:`** Dùng để giải thích các quyết định hiển thị giao diện, tính toán chiều cao động, hoặc điều kiện ẩn/hiện cụ thể.

_Ví dụ minh họa:_

```tsx
// QUYỀN: Mô tả chỉ được phép chỉnh sửa nếu người dùng hiện tại được gán công việc và không có đánh giá nào đang chờ xử lý.
const isEditable = isCurrentUserAssigned && !hasPendingReview;

// LOGIC: Trì hoãn 100ms để đảm bảo trình soạn thảo rich-text đã render xong trước khi đo chiều cao thực tế.
setTimeout(() => {
  checkScrollHeight();
}, 100);

// UI: Ẩn thanh công cụ soạn thảo trên thiết bị di động để tối ưu hóa không gian hiển thị thông tin.
const showToolbar = isDesktop;
```

---

## 8. QUY CHUẨN GIT & PULL REQUEST (PR) MERGE

### 8.1. Quy tắc đặt tên Nhánh (Branch Naming)

- **Định dạng nhánh tính năng:** Mọi nhánh làm việc cá nhân bắt buộc phải đặt tên theo định dạng sau (được kiểm soát tự động bởi Git Hooks):
  - `dev_{developer_name}_{feature_description}` (chữ thường không dấu, số, và dấu gạch dưới).
  - _Ví dụ hợp lệ:_ `dev_phong_update_view_board`, `dev_khue_initial_setup`.
- **Các nhánh đặc biệt:** Các nhánh chính như `main`, `master`, `develop`, `staging`, `production` là ngoại lệ được bỏ qua kiểm tra tự động định dạng tên này.

### 8.2. Quy chuẩn thông điệp Commit (Conventional Commits)

Mọi commit message khi đẩy lên repository bắt buộc tuân theo chuẩn **Conventional Commits**:

- **Cú pháp:** `<type>(<scope>): <subject>` (trong đó `<scope>` là tùy chọn).
- **Các type được chấp nhận:**
  - `feat`: Tính năng mới.
  - `fix`: Sửa lỗi.
  - `docs`: Cập nhật tài liệu/hướng dẫn.
  - `style`: Sửa định dạng code (khoảng trắng, dấu chấm phẩy, không ảnh hưởng logic).
  - `refactor`: Cải tiến hoặc tái cấu trúc mã nguồn mà không đổi hành vi hệ thống.
  - `chore`: Cập nhật cấu hình, thư viện, hoặc build script.
  - `perf`: Tối ưu hóa hiệu năng.
  - `test`: Thêm hoặc sửa mã kiểm thử.
- _Ví dụ hợp lệ:_
  - `feat: thêm màn hình danh sách kiểm kho`
  - `fix(warehouse): sửa lỗi hiển thị số lượng tồn kho`
  - `chore: cập nhật thư viện tailwindcss lên phiên bản mới`
- **Kiểm soát tự động:** Dự án sử dụng `Husky` kết hợp `commitlint` để từ chối commit ngay tại máy local nếu thông điệp không hợp lệ. Nếu gặp trường hợp khẩn cấp thực sự cần bỏ qua, lập trình viên có thể dùng cờ `--no-verify` (không khuyến khích).

### 8.3. Hệ thống Kiểm soát chất lượng tự động qua Git Hooks (Husky)

Để đảm bảo mã nguồn luôn ổn định, sạch sẽ và không gây lỗi khi đưa lên repository, dự án bắt buộc cấu hình Husky để kiểm tra các cổng chất lượng (Quality Gates) tự động ngay dưới máy local của lập trình viên:

- **Cổng kiểm soát khi tạo Commit (Pre-commit Hook):** Khi chạy lệnh `git commit`, Husky sẽ tự động thực thi tuần tự:
  1.  **Format Code (Format Check):** Tự động format toàn bộ mã nguồn thay đổi theo chuẩn Prettier (2-space indentation) để tránh lỗi định dạng khác biệt giữa các máy dev.
  2.  **Lint Code (Lint Check):** Chạy `npm run lint` để kiểm tra lỗi cú pháp, biến thừa và nghiêm cấm kiểu `any` trong TypeScript. Nếu linter báo lỗi, commit sẽ bị chặn.
  3.  **Build Dự án (Build Check):** Chạy lệnh biên dịch và build thử nghiệm `npm run build` (hoặc `tsc -b && vite build`) để đảm bảo các thay đổi không làm hỏng tiến trình build của ứng dụng. Nếu build lỗi, commit sẽ bị chặn.
  4.  **Branch Name Check:** Kiểm tra tên branch hiện tại có tuân thủ đúng định dạng `dev_{developer_name}_{feature_description}` hay không.
- **Cổng kiểm soát Thông điệp Commit (Commit-msg Hook):** Kiểm tra nội dung commit message có khớp với định dạng Conventional Commits hay không để tự động cho phép hoặc chặn việc commit.
- **Quy định bỏ qua:** Chỉ sử dụng cờ `--no-verify` trong trường hợp sửa đổi khẩn cấp (hotfix) được Tech Lead đồng ý, không được tự ý lạm dụng để lách các kiểm tra chất lượng này.

### 8.4. Quy trình Pull Request (PR) & Chiến lược Merge

Để duy trì chất lượng mã nguồn cao nhất trước khi tích hợp vào nhánh chung:

- **Tạo PR:**
  - Luôn tạo PR từ nhánh tính năng `dev_*` trỏ về nhánh phát triển chung (`develop` hoặc `staging`).
  - Tiêu đề PR phải tuân thủ Conventional Commits tương tự như commit message (ví dụ: `feat: tích hợp màn hình đối chiếu kho`).
  - Mô tả PR phải liệt kê rõ danh sách thay đổi, mã ticket/task liên quan, và các bước để người review kiểm thử/verify.
- **Yêu cầu Review:**
  - Mỗi PR phải nhận được ít nhất **1 approval** từ Tech Lead hoặc đồng nghiệp được chỉ định trước khi merge.
  - Nghiêm cấm tự phê duyệt (Self-approval) cho PR của mình.
  - _Nội dung review bắt buộc:_ Kiểm tra việc rò rỉ kiểu dữ liệu `any`, vòng lặp Require Cycles (lỗi Import Barrel), và kiểm soát phân quyền (`// QUYỀN:`).
- **Chiến lược Merge (Squash and Merge):**
  - Thống nhất áp dụng chiến lược **Squash and Merge** khi tích hợp PR từ nhánh cá nhân vào nhánh phát triển chung (`develop`/`main`).
  - _Mục đích:_ Gộp tất cả các commit nhỏ, commit thử nghiệm của nhánh tính năng thành **1 commit duy nhất** trên nhánh chính. Việc này giúp giữ lịch sử Git của nhánh phát triển chung luôn sạch sẽ, rõ ràng và dễ dàng theo dõi (traceability).
  - **Dọn dẹp:** Bắt buộc xóa nhánh tính năng (`dev_*`) trên server ngay sau khi PR được merge thành công để giữ vệ sinh repository.

```

```
