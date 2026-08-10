# Chi Tiết Cơ Chế Chỉ Mục B+Tree, Partitioning & Full-Text Search

## 1. Cơ Chế Chỉ Mục B+Tree trong InnoDB

### Clustered Index & Secondary Index

- **Clustered Index**: Primary Key chính là bảng dữ liệu thực tế. Các nút lá (leaf nodes) chứa toàn bộ dữ liệu cột của hàng.
- **Secondary Index & Double Lookup**: Secondary Index chỉ lưu giá trị Primary Key. Truy vấn không bao phủ (non-covering) phải chịu **Double Lookup** (Tra cứu 2 lần: chỉ mục phụ -> lấy PK -> tra cứu Clustered Index).

### Quy Tắc Tiền Tố Trái Nhất & Phép So Sánh Phạm Vi (Range Breaks)

Khi có chỉ mục `INDEX (col1, col2, col3)`:

- Phép so sánh phạm vi (`>`, `<`, `BETWEEN`, `LIKE 'abc%'`) trên `col2` sẽ **NGẮT** khả năng dùng chỉ mục của `col3`.
- **Quy tắc thứ tự Composite Index**: Đặt cột `=` lên đầu -> Cột _Selectivity_ cao -> Cột so sánh phạm vi ở **CUỐI CÙNG**.

### Hệ Thống Đánh Giá Chỉ Mục 3-Sao (Three-Star Index System)

- ⭐️ **Star 1**: Gom các hàng liên quan nằm cạnh nhau trong lá B-Tree (lọc chính xác qua `WHERE`).
- ⭐️⭐️ **Star 2**: Dữ liệu trong chỉ mục đã được sắp xếp sẵn theo đúng thứ tự (`ORDER BY`). Tránh `Using filesort`.
- ⭐️⭐️⭐️ **Star 3**: Chỉ mục chứa **TOÀN BỘ** cột truy vấn yêu cầu (`SELECT`, `WHERE`, `ORDER BY`). Tận dụng _Covering Index_ (`Using index`).

---

## 2. Tối Ưu Hóa `GROUP BY` & `DISTINCT` (Scan Mechanics)

- **Tight Index Scan**: MySQL quét tuần tự chỉ mục B-Tree đã sắp xếp sẵn để gom cụm các hàng thuộc cùng nhóm.
- **Loose Index Scan (`Using index for group-by`)**: MySQL "nhảy" (seek) trực tiếp đến điểm bắt đầu của từng nhóm và bỏ qua các bản ghi trung gian -> Cực nhanh.
- **Quy tắc `ORDER BY NULL`**: `GROUP BY` mặc định sắp xếp kết quả. Nếu không cần thứ tự, thêm `ORDER BY NULL` để tránh bước `Filesort` ngầm.

---

## 3. Partitioning (Phân Mảnh Bảng)

### Bản Chất Kỹ Thuật (Coarse Indexing)

- Phân mảnh hoạt động như một lớp _Handler Wrapper_ bao quanh nhiều bảng vật lý phụ.
- **Mục đích**: Đóng vai trò là **Chỉ mục thô (Coarse Indexing)** thu hẹp vùng dữ liệu ở quy mô Terabytes.

### Bẫy Hiệu Năng Với Secondary Index

- Mỗi phân mảnh quản lý một cây chỉ mục cục bộ (_Local Index_).
- Truy vấn chứa điều kiện **KHÔNG thuộc Partitioning Key** buộc MySQL phải mở và tìm kiếm trên **TẤT CẢ các phân mảnh** -> Chi phí lớn hơn nhiều so với 1 bảng không phân mảnh.

### Quy Tắc Thiết Kế Partitioning:

1. Mọi Primary Key / Unique Index phải bao gồm tất cả các cột thuộc Partitioning Key.
2. Giới hạn số lượng phân mảnh tối đa khoảng **150-200** để tránh overhead mở/khóa Handler.
3. Luôn dùng điều kiện lọc chuẩn để kích hoạt **Pruning** (cắt tỉa phân mảnh, kiểm tra bằng `EXPLAIN PARTITIONS`).

---

## 4. Full-Text Search (FTS) vs B-Tree

### Inverted Index (Chỉ Mục Đảo Ngược)

- B-Tree không thể tìm từ nằm giữa chuỗi (`LIKE '%keyword%'` gây Full Table Scan).
- FTS phân rã văn bản thành các từ khóa (keywords) và lưu con trỏ tài liệu tương ứng.
- Sử dụng cú pháp `MATCH(content) AGAINST('keyword' IN BOOLEAN MODE)`.

### Khi Nào Cần Chuyển Sang Sphinx / Elasticsearch?

1. Dữ liệu quy mô Terabyte / Hàng trăm triệu dòng.
2. Cần tìm kiếm phân tán (Distributed Search trên dữ liệu Sharding).
3. Yêu cầu độ chính xác cao về vị trí từ (Phrase Proximity / BM25 Ranking phức tạp).
4. Phân trang trang lớn (`OFFSET` lớn) trên kết quả tìm kiếm.

---

## 5. Cơ Chế Change Buffer (Insert Buffer) Trong InnoDB

- **Tác dụng**: Tránh bão _Random Disk I/O_ khi `INSERT/UPDATE` trên các chỉ mục phụ không duy nhất (Non-unique Secondary Indexes).
- **Cách hoạt động**: Khi trang chỉ mục phụ chưa nằm trong Buffer Pool, InnoDB hoãn ghi đĩa và lưu thay đổi vào Change Buffer. Khi trang đó được đọc vào RAM theo cách tự nhiên, InnoDB thực hiện **Merge** hàng loạt thay đổi vào đĩa trong 1 thao tác I/O duy nhất.
