---
name: mysql-optimization
description: Quy chuẩn và kỹ thuật tối ưu hóa MySQL, chỉ mục (Index), thiết kế Schema và Eloquent/Query Builder trong dự án Laravel Apiato.
---

# MySQL Performance & Query Optimization Skill

Tài liệu hướng dẫn quy chuẩn và kỹ thuật tối ưu hóa MySQL cho Developer và AI Agent khi làm việc với Laravel 9 / Apiato framework.

---

## ⚡ 1. Quy Tắc Nhanh (Quick Checklist)

- 🚫 **Không dùng `SELECT *`**: Luôn chọn chính xác danh sách cột cần thiết để tận dụng _Covering Index_ và giảm băng thông CPU/RAM.
- 🚫 **Tránh N+1 Query**: Luôn Eager Load mối quan hệ (`with([...])`) ở tầng Task/Repository.
- 🚫 **Không dùng OFFSET lớn**: Với trang lớn (`LIMIT 500000, 20`), sử dụng _Deferred Join_ hoặc _Keyset Pagination_.
- 🛡️ **Bắt buộc `NOT NULL`**: Đặt `NOT NULL` và giá trị mặc định cho cột trừ khi bắt buộc cần logic `NULL`.
- 🔑 **Thứ tự Composite Index**: Đặt cột so sánh bằng (`=`) lên trước -> Cột có _Selectivity_ cao -> Cột so sánh khoảng (`>`, `<`, `BETWEEN`, `LIKE`) ở cuối cùng.
- ⏳ **Transaction Ngắn**: Không thực hiện API call ngoài, upload file hay gửi email bên trong `DB::transaction(...)`.

---

## 🎯 2. Thiết Kế Schema, Data Types & Functional Indexes

1. **Kiểu dữ liệu nhỏ nhất có thể**:
   - Dùng `TINYINT` cho status/type thay vì `INT` hoặc `VARCHAR`.
   - Dùng `BIGINT AUTO_INCREMENT` hoặc `UUID v7` (Ordered UUID) làm Primary Key. Tránh UUID v4 (ngẫu nhiên) gây _Page Splits_ trên InnoDB Clustered Index.
   - Lưu IP bằng `INT UNSIGNED` kết hợp `INET_ATON()` / `INET_NTOA()`.
2. **Virtual / Stored Generated Columns & Multi-Valued Indexes**:
   - Tránh bọc cột bằng hàm trong `WHERE`. Dùng Virtual Generated Column để lập chỉ mục cho biểu thức hoặc trường JSON.
   - Đồng bộ Character Set và Collation toàn hệ thống để tránh lỗi ép kiểu ngầm làm vô hiệu hóa B-Tree Index.

Chi tiết nguyên lý & so sánh: [Schema, Types & Functional Indexes Reference](references/schema_and_types.md)

---

## 🔍 3. Chiến Lược Lập Chỉ Mục (Indexing Strategy)

1. **B+Tree & Clustered Index**:
   - Primary Key chính là bảng dữ liệu thực tế. Secondary Index lưu giá trị Primary Key.
   - Truy vấn không bao phủ qua Secondary Index phải chịu **Double Lookup** (Tra cứu 2 lần).
2. **Quy tắc Tiền Tố Trái Nhất (Leftmost Prefix Rule)**:
   - Phép so sánh phạm vi (`>`, `<`, `BETWEEN`, `LIKE 'abc%'`) trên cột `A` sẽ **ngắt** khả năng dùng chỉ mục của các cột phía sau.
3. **Partitioning & Full-Text Search (FTS)**:
   - Partitioning đóng vai trò là _Coarse Indexing_. Không dùng cho bảng có nhiều Secondary Indexes không chứa Partition Key.
   - FTS sử dụng _Inverted Index_. Chuyển sang Sphinx/Elasticsearch khi dữ liệu đạt hàng trăm triệu dòng hoặc cần phân trang/tìm kiếm phân tán.

Chi tiết nguyên lý & Hệ thống 3-Sao: [Indexing Mechanics Reference](references/indexing_mechanics.md)

---

## 🚀 4. Kỹ Thuật Viết Lại Truy Vấn (Query Refactoring Recipes)

1. **Deferred Join cho Pagination Lớn**:
   ```php
   $posts = DB::table('posts')
       ->joinSub(
           DB::table('posts')->select('id')->orderBy('created_at', 'desc')->offset(500000)->limit(20),
           'sub',
           'posts.id',
           '=',
           'sub.id'
       )
       ->get(['posts.id', 'posts.title', 'posts.content', 'posts.created_at']);
   ```
2. **Refactor `ORDER BY RAND()` & `IN()` lớn**:
   - Dùng _PK Range Sampling_ ($O(\log n)$) hoặc _Deferred Join_ cho `ORDER BY RAND()`.
   - Với danh sách `IN()` > 1,000 phần tử, refactor sang JOIN bảng tạm có `PRIMARY KEY`.
3. **Đánh Giá EXPLAIN & Optimizer Hints**:
   - `type`: `const` > `eq_ref` > `ref` > `range` > `index` > `ALL` (Full Table Scan 🚨).
   - Red Flags: `Using temporary; Using filesort` 🚨.
   - Dùng `STRAIGHT_JOIN` để ép thứ tự JOIN và bỏ qua chi phí Greedy Search của Optimizer.

Chi tiết công thức Refactor & Đọc EXPLAIN: [Query Refactoring Recipes Reference](references/query_refactoring_recipes.md)

---

## 🔒 5. Quản Lý Giao Dịch, Khóa & Deadlock (Transactions & Locks)

1. **Next-Key Locks & Gap Locks**:
   - `REPEATABLE READ` khóa các khoảng trống (Gaps) để chống Phantom Read. Tránh lạm dụng `FOR UPDATE` trên phạm vi rộng gây Deadlock.
2. **Bẫy Khóa Ngoại (Foreign Key Traps)**:
   - Bắt buộc tạo chỉ mục cho mọi cột Foreign Key ở bảng con để tránh Full Table Scan & Full Table Lock ở bảng con khi `UPDATE/DELETE` ở bảng cha.
3. **Bulk Insert & Queue Worker Pattern**:
   - Dùng Multi-row Insert với Chunking (1,000 - 10,000 dòng/lô). Đặt `innodb_autoinc_lock_mode = 2` nếu dùng Row-Based Replication.
   - Dùng Atomic Update direct cho Queue Worker thay vì `SELECT FOR UPDATE`:
     ```php
     $affected = DB::table('jobs')
         ->where('status', 'pending')
         ->limit(1)
         ->update(['status' => 'processing', 'worker_id' => $workerId]);
     ```

Chi tiết quản lý Transaction & Deadlock: [Transactions & Locks Reference](references/transactions_and_locks.md)
