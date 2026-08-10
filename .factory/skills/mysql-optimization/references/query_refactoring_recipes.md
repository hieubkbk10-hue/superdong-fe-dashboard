# Công Thức Refactor Truy Vấn SQL & Đọc EXPLAIN

## 1. Công Thức Phân Trang Vô Hạn (Pagination Refactoring)

### Deferred Join (Nối Trì Hoãn)

`LIMIT 1000000, 20` buộc MySQL quét 1,000,020 bản ghi rồi vứt bỏ 1,000,000 bản ghi đầu.
Dùng Covering Index để lấy `id` trước, sau đó `JOIN` lấy thông tin chi tiết:

```sql
SELECT o.id, o.user_id, o.status, o.total_amount, o.created_at
FROM orders o
INNER JOIN (
    SELECT id FROM orders ORDER BY created_at DESC LIMIT 1000000, 20
) AS lim ON o.id = lim.id;
```

### Keyset Pagination (Seek Method)

Lưu lại mốc `id` / `created_at` của trang trước để lọc trực tiếp:

```sql
SELECT id, user_id, status, total_amount, created_at
FROM orders
WHERE created_at <= '2026-07-01 10:00:00' AND id < 894520
ORDER BY created_at DESC, id DESC LIMIT 20;
```

---

## 2. Refactor `ORDER BY RAND()` (Ba Công Thức Tối Ưu)

`ORDER BY RAND()` tính toán `RAND()` cho mọi hàng và thực hiện Filesort trên bảng tạm -> Gây Random I/O storm và treo CPU.

- **Recipe 1: PK Range Sampling (Lấy 1 hàng - $O(\log n)$)**:
  ```php
  // Code ứng dụng:
  $randId = rand($minId, $maxId);
  $row = DB::table('products')->where('id', '>=', $randId)->first();
  ```
- **Recipe 2: Deferred Join Sampling (Lấy N hàng)**:
  ```sql
  SELECT t.* FROM products t
  JOIN (SELECT id FROM products ORDER BY RAND() LIMIT 5) tmp ON t.id = tmp.id;
  ```
- **Recipe 3: Slot-based Sampling (High Concurrency)**:
  Tạo cột `slot` liên tục (1..N), chọn ngẫu nhiên danh sách slot ở PHP và `WHERE slot IN (r1, r2, r3)`.

---

## 3. Refactor Danh Sách `IN()` Khổng Lồ

- **Bản chất**: MySQL sắp xếp danh sách `IN()` và dùng Tìm kiếm nhị phân $O(\log n)$. Tuy nhiên, danh sách > 1,000 phần tử làm phình query parser và Optimizer.
- **Recipe Bảng Tạm**:
  ```sql
  -- Chuyển IN(...) lớn thành JOIN bảng tạm có PRIMARY KEY:
  CREATE TEMPORARY TABLE temp_ids (id INT PRIMARY KEY);
  -- Insert batch IDs vào temp_ids ...
  SELECT o.* FROM orders o JOIN temp_ids t ON o.user_id = t.id;
  ```

---

## 4. CTEs vs Derived Tables vs Temporary Tables

- **Derived Tables (Subquery `FROM`)**: MySQL 5.5 tạo bảng tạm ẩn không có chỉ mục.
- **CTE (`WITH ... AS`)**: Giúp mã SQL sạch hơn. Nếu CTE có cột `BLOB/TEXT` hoặc vượt `tmp_table_size`, nó sẽ bị **Materialize ra đĩa**.
- **Temporary Tables Tường Minh (`CREATE TEMPORARY TABLE`)**: Cho phép tự tạo `PRIMARY KEY` / `INDEX`. Khuyên dùng cho tập dữ liệu trung gian lớn cần JOIN nhiều lần.

---

## 5. Tối Ưu Hóa `COUNT(*)`

- **Bản chất**: InnoDB phải quét B-Tree Index do cơ chế MVCC ($O(n)$).
- **SOP `COUNT(*)` vs `COUNT(col)`**: `COUNT(*)` là chuẩn vì MySQL tối ưu không nạp cột. `COUNT(col)` chỉ đếm NON-NULL và chậm hơn nếu không có index.
- **Recipe Counter Table với Random Slots**:
  ```sql
  -- Cập nhật đồng thời không lo nghẽn lock (Random Slot 1..100):
  UPDATE hit_counter SET cnt = cnt + 1 WHERE slot = FLOOR(RAND() * 100);
  -- Đọc tổng số lượt đếm cực nhanh:
  SELECT SUM(cnt) FROM hit_counter;
  ```

---

## 6. Cẩm Nang EXPLAIN & Optimizer Hints

### Cột `type` (Tốt -> Tệ):

`const` > `eq_ref` > `ref` > `range` > `index` > `ALL` (Full Table Scan 🚨).

### Red Flags Trong Cột `Extra`:

- 🚨 `Using temporary`: Bảng tạm được tạo để gom nhóm/sắp xếp.
- 🚨 `Using filesort`: Không dùng được chỉ mục để sắp xếp `ORDER BY`.
- 🟢 `Using index`: Covering Index thành công.

### Optimizer Hints Thường Dùng:

- `STRAIGHT_JOIN`: Ép thứ tự JOIN đúng theo câu lệnh SELECT (loại bỏ chi phí lập kế hoạch Greedy Search của Optimizer).
- `FORCE INDEX (idx_name)`: Ép Optimizer dùng chỉ mục cụ thể khi thống kê (_Statistics_) bị lệch.
