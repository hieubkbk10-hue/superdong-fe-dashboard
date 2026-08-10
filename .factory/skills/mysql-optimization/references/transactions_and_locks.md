# Chi Tiết Quản Lý Transaction, Khóa & Deadlock Trong InnoDB

## 1. Mức Độ Cô Lập & Next-Key / Gap Locks

### Mức Cô Lập (Isolation Levels)

- `REPEATABLE READ` _(Mặc định MySQL)_: Sử dụng **Next-Key Locks** (Record Lock + Gap Lock) để ngăn chặn hiện tượng Phantom Reads.
- `READ COMMITTED`: Không dùng Gap Lock (trừ khi kiểm tra FK/Unique). Giúp giảm nguy cơ Deadlock đáng kể trong các ứng dụng Web.

### Cơ Chế Gap Lock & Deadlock Trap

- **Gap Lock**: Khóa khoảng trống giữa các bản ghi chỉ mục. Nhiều transaction có thể cùng giữ Gap Lock trên cùng 1 khoảng trống (không chặn nhau đọc).
- **Deadlock Trap với `FOR UPDATE`**:
  1. Transaction A giữ Gap Lock (10, 20) qua `SELECT ... BETWEEN 10 AND 20 FOR UPDATE`.
  2. Transaction B cũng chạy câu lệnh trên và giữ Gap Lock (10, 20).
  3. Transaction A `INSERT` ID 15 -> Bị chặn bởi Gap Lock của B.
  4. Transaction B `INSERT` ID 16 -> Bị chặn bởi Gap Lock của A.
  5. **Deadlock!** InnoDB buộc rollback 1 trong 2 transaction.

---

## 2. Bẫy Khóa Ngoại (Foreign Key Lock Traps)

- **Nguyên lý**: Khi `UPDATE/DELETE` ở bảng cha, InnoDB phải kiểm tra bảng con.
- **Tác hại của Unindexed Foreign Key**: Nếu cột FK ở bảng con **không có chỉ mục**, InnoDB phải thực hiện **Full Table Scan trên bảng con** và **KHÓA TOÀN BỘ BẢNG CON** 🚨.
- **SOP**: Bắt buộc tạo chỉ mục cho mọi cột Foreign Key ở bảng con.

---

## 3. Cẩm Nang Giải Mã Log Deadlock (`SHOW ENGINE INNODB STATUS`)

Log bao gồm các phần chính:

1. `*** (1) TRANSACTION:` & `*** (2) TRANSACTION:`: Mã transaction, thread ID và câu lệnh SQL gây xung đột.
2. `WAITING FOR THIS LOCK TO BE GRANTED`: Loại khóa đang chờ (`X` exclusive hoặc `S` shared), tên chỉ mục (`PRIMARY` hoặc Secondary Index).
3. `HOLDS THE LOCK(S)`: Khóa mà transaction kia đang nắm giữ.
4. **Victim Selection**: InnoDB chọn transaction có số bản ghi bị khóa ít hơn để Rollback.
5. **Red Flag `GEN_CLUST_INDEX`**: Bảng thiếu Primary Key nên InnoDB phải tự tạo index ẩn -> Bắt buộc bổ sung Primary Key cho bảng ngay!

---

## 4. Chế Độ Khóa Tự Tăng (`innodb_autoinc_lock_mode`)

- **Mode 0 (Traditional)**: Khóa cấp bảng cho mọi lệnh INSERT. An toàn SBR nhưng hiệu năng kém.
- **Mode 1 (Consecutive - Mặc định)**: Dùng mutex nhẹ cho Simple Inserts, dùng khóa bảng cho Bulk Inserts.
- **Mode 2 (Interleaved)**: **Hiệu năng ghi song song cao nhất** (không khóa bảng), nhưng **BẮT BUỘC** phải dùng **Row-Based Replication (`binlog_format = ROW`)**.

---

## 5. Kỹ Thuật Bulk Insert & Upsert (`ON DUPLICATE KEY UPDATE`)

### Bulk Insert Best Practices:

1. **Multi-row Insert**: Gộp các lệnh `INSERT` đơn lẻ thành lô (1,000 - 10,000 dòng/câu lệnh) để giảm RTT mạng và overhead Redo Log.
2. **Transaction Chunking**: Không gộp hàng triệu dòng vào 1 transaction duy nhất (gây phình Undo Log). Hãy `COMMIT` sau mỗi lô 10,000 dòng.
3. **`innodb_log_file_size`**: Đảm bảo kích thước Redo Log đủ lớn để tránh hiện tượng "Furious Flushing" gây treo I/O khi Bulk Insert.

### Queue Worker Atomic Update Pattern (Né Deadlock & Lock Contention):

```php
// Thay vì SELECT ... FOR UPDATE (dễ deadlock):
$affected = DB::table('jobs')
    ->where('status', 'pending')
    ->limit(1)
    ->update(['status' => 'processing', 'worker_id' => $workerId]);
```
