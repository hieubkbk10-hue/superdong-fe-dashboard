# Chi Tiết Thiết Kế Schema, Kiểu Dữ Liệu & Functional Indexes

## 1. Nguyên Lý Chọn Kiểu Dữ Liệu (Smaller is Better)

- Dữ liệu nhỏ giúp bảng vật lý nhỏ hơn, chứa được nhiều hàng hơn trong 1 trang bộ nhớ (Database Page 16KB).
- Giúp InnoDB Buffer Pool lưu trữ được nhiều trang hơn, tăng Tỷ lệ trúng bộ đệm (Cache Hit Ratio) và giảm Random Disk I/O.

### Chi Tiết Chọn Kiểu Số & Chuỗi:

- `TINYINT`: 1 byte (-128..127 hoặc 0..255 UNSIGNED). Dành cho status, enum dạng số, flag boolean.
- `SMALLINT`: 2 bytes (-32,768..32,767 hoặc 0..65,535 UNSIGNED). Dành cho danh mục nhỏ, năm.
- `INT`: 4 bytes. Dành cho Foreign Keys hoặc số lượng vừa.
- `BIGINT`: 8 bytes. Dành cho Primary Keys của bảng dữ liệu lớn (logs, transactions, orders).
- `VARCHAR(N)`: Tránh khai báo `VARCHAR(255)` ngẫu nhiên vì MySQL cấp phát bộ nhớ RAM tạm thời lớn dựa trên độ dài khai báo khi thực hiện `GROUP BY` hoặc `ORDER BY`.
- `TEXT` / `BLOB`: Lưu dữ liệu ngoài trang (Off-page storage). Cột `TEXT` không thể đưa hoàn toàn vào B-Tree Index (chỉ lập chỉ mục tiền tố). Khi truy vấn tạo bảng tạm trên đĩa (Disk-based temporary table), gây giảm hiệu năng nghiêm trọng.

## 2. Quy Tắc Tránh NULL (Avoid NULL)

- **Tác hại vật lý**: Cột nullable yêu cầu InnoDB dành riêng một ma trận bit (NULL bitmap) để theo dõi trạng thái NULL của từng hàng trong trang đĩa.
- **Tác hại truy vấn**:
  - Phép so sánh với NULL đòi hỏi cú pháp `IS NULL` / `IS NOT NULL`.
  - Các hàm tổng hợp như `COUNT(column)` tự động bỏ qua giá trị NULL, dễ gây sai lệch logic.
  - Khi cột chứa NULL nằm trong Composite Index, việc tính toán tính chọn lọc (Cardinality) của Optimizer trở nên kém chính xác.

## 3. Quy Tắc Lưu Trữ Địa Chỉ IP

- **Đúng**: `INT UNSIGNED` cho IPv4 (chỉ tốn 4 bytes) thay vì `VARCHAR(15)`.
  - Viết vào DB: `INET_ATON('192.168.1.1')` -> Số `3232235777`.
  - Đọc ra từ DB: `INET_NTOA(3232235777)` -> Chuỗi `'192.168.1.1'`.
  - Với IPv6: Dùng `BINARY(16)` kết hợp `INET6_ATON()` và `INET6_NTOA()`.

## 4. Functional Indexes & Generated Columns (Virtual vs Stored)

### Nguyên lý Cô lập cột (Isolating the Column):

Khi bọc cột bằng hàm (ví dụ `WHERE YEAR(created_at) = 2026` hoặc `WHERE actor_id + 1 = 5`), giá trị đầu ra không khớp với thứ tự sắp xếp vật lý trong cây B-Tree -> MySQL buộc phải **Full Table Scan**.

### Virtual vs Stored Generated Columns Decision Matrix:

| Tiêu chí        | Virtual Generated Column                | Stored Generated Column              |
| :-------------- | :-------------------------------------- | :----------------------------------- |
| **Lưu trữ đĩa** | 不 (0 byte), tính toán khi đọc          | 有 (Lưu vật lý như cột thường)       |
| **Tốc độ Ghi**  | Rất nhanh (Không tốn I/O đĩa)           | Chậm hơn (Tính toán & ghi đĩa/index) |
| **Tốc độ Đọc**  | Có thể tốn CPU nếu hàm phức tạp         | Rất nhanh (Đọc trực tiếp index/đĩa)  |
| **Khuyên dùng** | Hàm đơn giản (`YEAR()`, `JSON_EXTRACT`) | Hàm phức tạp OR Tần suất đọc >> Ghi  |

### Kỹ thuật Pseudohash (Lập chỉ mục băm cho chuỗi dài):

```sql
-- Thay vì index chuỗi dài (URL), dùng CRC32 để index số nguyên 4-byte:
ALTER TABLE logs ADD url_crc INT UNSIGNED AS (CRC32(long_url)) VIRTUAL;
CREATE INDEX idx_url_crc ON logs(url_crc);

-- Query tối ưu (Lọc CRC32 trước, so sánh chuỗi sau để tránh đụng độ băm):
SELECT * FROM logs
WHERE url_crc = CRC32('https://example.com/very/long/url')
  AND long_url = 'https://example.com/very/long/url';
```

## 5. Dữ Liệu JSON & Multi-Valued Indexes (MySQL 8.0+)

- **Bản chất**: JSON lưu dạng Binary Format (cho phép Random Access), nhưng khi query `WHERE data->'$.key' = 'val'`, MySQL phải parse từng tài liệu JSON ở tầng CPU -> **Full Table Scan**.
- **Giải pháp Index Key đơn**: Dùng Virtual Generated Column + B-Tree Index.
- **Giải pháp Mảng JSON (Multi-Valued Index)**:
  ```sql
  -- Tạo Multi-valued Index cho mảng tags trong JSON:
  ALTER TABLE orders ADD INDEX idx_tags ( (CAST(data->'$.tags' AS UNSIGNED ARRAY)) );

  -- Query tối ưu tận dụng chỉ mục mảng:
  SELECT * FROM orders WHERE 2026 MEMBER OF (data->'$.tags');
  ```

## 6. Character Sets & Collations (Tác Động Ép Kiểu Ngầm)

- **Cơ chế ngầm**: Khi JOIN 2 cột có Collation khác nhau (ví dụ `utf8mb4_unicode_ci` vs `utf8mb4_0900_ai_ci`), MySQL thực hiện hàm ép kiểu ngầm `CONVERT(col USING ...)` -> **Vô hiệu hóa B-Tree Index**.
- **Vấn đề bộ nhớ VARCHAR**: MySQL cấp phát bộ nhớ tạm dựa trên số bytes tối đa của Collation (ví dụ UTF-8 mb4 dự phòng 4 bytes/ký tự). Cột `VARCHAR(1000)` tốn tới 4,000 bytes trong bộ nhớ RAM tạm khi SORT / GROUP BY.
- **SOP**: Luôn đồng bộ Character Set và Collation toàn bộ bảng trong database.
