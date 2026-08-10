# 1) Syntax / Cú pháp đáng học trong codebase này

Phần này chỉ giữ những cú pháp thật sự đáng học, tức là cú pháp giúp code **ít string tự gõ hơn, rõ ý đồ hơn, dễ refactor hơn, kiểm soát side effect tốt hơn**. Không liệt kê lại những thứ APIato generic như Route -> Request -> Controller -> Action -> Task, vì đã chọn APIato thì mặc định phải theo skeleton đó.

Tinh thần chính:

- Method/class/object > magic string.
- Explicit source of truth > hardcode rải rác.
- Cú pháp có tên rõ > cú pháp ngắn nhưng ẩn ý.
- Cú pháp kiểm soát side effect > cú pháp chạy được nhưng dễ bắn event/notification sai.
- Cú pháp phục vụ nghiệp vụ dài hạn > cú pháp CRUD nhanh cho xong.

## 1.1) Named Global Scope cho eager-load mặc định

**Code mẫu:**

```php
static::addGlobalScope('withDefault', function ($builder) {
    $builder->with(['files', 'userIds', 'viewerIds', 'followerIds'])
        ->withCount('comments');
});
```

**Tệ (Tĩnh/Rải rác):**

- Dùng `$with` ở model: Khó tắt lẻ, không gộp được `withCount`.
- Gọi `with()` rải rác ở Task: Lặp code, không nhất quán, dễ sót gây N+1 query.

**Hay (Động/Nhất quán):**

- **Có tên (`withDefault`):** Tự giải thích ý đồ nghiệp vụ.
- **Tắt linh hoạt:** Bỏ qua dễ dàng khi truy vấn nhẹ thông qua `withoutGlobalScope('withDefault')`.
- **Gộp hành vi:** Khai báo tập trung cả eager-load (`with`) và đếm số lượng (`withCount`).
- **Nhất quán:** Đồng bộ cấu trúc dữ liệu trả về giữa các endpoint API.

**Rule chọn nơi đặt `with()` cho AI Agent:**

- Dùng `with()` trong Task/Repository query khi relation chỉ phục vụ use case đó.
- Nếu cùng một payload relation luôn cần ở nhiều endpoint list/detail, gom vào named global scope như `withDefault`, không dùng `$with` bừa.
- Nếu chỉ cần số lượng, dùng `withCount`; nếu chỉ cần boolean tồn tại, dùng `withExists`.
- Nếu Transformer hoặc permission method đọc relation theo từng item, Task phải preload trước hoặc Model method phải kiểm tra `relationLoaded()` rồi mới fallback query.
- Không đặt query shape trong Controller/Transformer. Controller mỏng, Transformer chỉ transform dữ liệu đã chuẩn bị.

## 1.2) `getTableName()` làm source of truth cho tên bảng

**Code mẫu:**

```php
// Khai báo trong Model
public static function getTableName() { return 'works'; }

// Sử dụng ở Migration
Schema::create(Work::getTableName(), function (Blueprint $table) { ... });

// Sử dụng ở Validation
Rule::exists(Project::getTableName(), 'id')
```

**Tệ (Magic string):**

- Hardcode trực tiếp `'works'`, `'projects'` ở validation rules, foreign keys, migrations.
- Rủi ro: Dễ gõ sai chính tả (typo), cực kỳ khó refactor khi cần đổi tên bảng.

**Hay (Nhất quán):**

- **Một nguồn sự thật (Single Source of Truth):** Tên bảng do Model định nghĩa và làm chủ.
- **Đồng bộ hóa:** Migration, validation, foreign key cùng nhìn về một hàm của Model.
- **Dễ bảo trì:** Đổi tên bảng chỉ cần cập nhật tại Model, tránh bị sót.

## 1.3) `Rule::exists()` / `Rule::unique()` thay vì validation string DB

**Code mẫu:**

```php
'project_id' => ['required', Rule::exists(Project::getTableName(), 'id')],
'email' => ['required', 'email', Rule::unique(User::getTableName(), 'email')],
```

**Tệ (String validation):**

- Viết `'project_id' => 'required|exists:projects,id'` hoặc `'unique:users,email'`.
- Rủi ro: Hardcode tên bảng dưới dạng magic string, dễ typo, IDE không hỗ trợ refactor/tìm kiếm lớp Model liên quan.

**Hay (Object rule):**

- **Không hardcode:** Tên bảng tự động lấy từ `Model::getTableName()`.
- **Khả năng mở rộng (Chainable):** Dễ dàng thêm điều kiện truy vấn phức tạp:
  ```php
  Rule::exists(Work::getTableName(), 'id')->where('project_id', $this->project_id)->whereNull('parent_id')
  ```
- **IDE friendly:** Dễ dàng định vị và liên kết các class Model (`Project`, `User`) thông qua IDE.

## 1.4) Fluent delete constraint thay vì `onDelete('...')`

**Code mẫu:**

```php
$table->foreign('project_id')->references('id')->on(Project::getTableName())->cascadeOnDelete();
$table->foreign('recurrence_id')->references('id')->on(Work::getTableName())->nullOnDelete();
```

**Tệ (Magic string):**

- Dùng `->onDelete('cascade')` hoặc `->onDelete('set null')`.
- Rủi ro: Sử dụng chuỗi cấu hình (magic string) dễ gõ sai âm thầm, IDE không tự động gợi ý hay báo lỗi được.

**Hay (Fluent API):**

- **Không magic string:** Sử dụng phương thức chuẩn như `cascadeOnDelete()` hoặc `nullOnDelete()`.
- **Tường minh:** Tên phương thức thể hiện trực tiếp hành động nghiệp vụ tại tầng DB.
- **IDE friendly:** Được gợi ý code tự động từ IDE, phát hiện lỗi cú pháp ngay lập tức.

## 1.5) Explicit foreign key khi dự án dùng table source of truth

**Code mẫu:**

```php
$table->unsignedBigInteger('user_id');
$table->foreign('user_id')->references('id')->on(User::getTableName())->cascadeOnDelete();
```

**Laravel Docs thông thường (Ẩn/Tự ngầm hiểu):**

- Dùng `$table->foreignId('user_id')->constrained()->cascadeOnDelete();`.
- Thích hợp cho dự án nhỏ tuân thủ convention mặc định của Laravel.

**Tại sao codebase dùng Explicit FK (Tường minh):**

- **Nhất quán source of truth:** Sử dụng trực tiếp `Model::getTableName()`.
- **Tránh Laravel tự đoán:** An toàn tuyệt đối khi dùng với pivot/custom table không theo convention mặc định.
- **Rõ ràng thông tin:** Thể hiện đủ 3 thành phần (column type, referenced column, referenced table) ngay trong file migration.

## 1.6) `sanitizeInput()` whitelist thay vì `$request->all()`

**Code mẫu:**

```php
$data = $request->sanitizeInput([
    'project_id',
    'parent_id',
    'name',
    'description',
    'requester_id' => Auth::id(), // Server-owned field
]);
```

**Tệ (Nhận toàn bộ dữ liệu từ request):**

- Dùng `$request->all()` truyền trực tiếp vào các Action/Task.
- Rủi ro: Lỗ hổng Mass Assignment, client có thể cố ý chèn thêm các field nhạy cảm (như chỉnh sửa `role`, `user_id`).

**Hay (Whitelisting & Sanitization):**

- **Kiểm soát chặt chẽ:** Chỉ cho phép các trường nằm trong whitelist đi tiếp vào tầng nghiệp vụ (business flow).
- **Gán dữ liệu backend an toàn:** Kết hợp gán trực tiếp dữ liệu do server quản lý (như `Auth::id()`) thay vì tin cậy thông tin từ client gửi lên.
- **Lọc dữ liệu sớm:** Biến Request thành một ranh giới (boundary) trả về dữ liệu sạch và an toàn cho hệ thống.

## 1.7) Nested validation rõ shape payload, không chỉ `array`

**Code mẫu:**

```php
// Validate mảng định hình sẵn key
'checklist' => 'nullable|array',
'checklist.*' => 'array:name,done', // Chỉ cho phép chứa key 'name' và 'done'
'checklist.*.name' => 'max:200',
'checklist.*.done' => 'boolean',

// Validate động phức tạp qua Closure
'schedule' => [
    'nullable', 'array',
    function ($attribute, $value, $fail) {
        // Validate động tùy thuộc vào giá trị type: date, week, month...
    },
],
```

**Tệ (Validate nông):**

- Chỉ check `'checklist' => 'array'` mà không validate các phần tử bên trong.
- Rủi ro: Gây lỗi crash (HTTP 500) do thiếu key hoặc bắt buộc phải viết nhiều hàm `isset()` kiểm tra lặp đi lặp lại ở tầng nghiệp vụ.

**Hay (Chặn sớm & Định hình cấu trúc):**

- **Fail-Fast (Chặn lỗi sớm):** Trả về lỗi HTTP 422 ngay lập tức nếu client chèn key lạ hoặc sai kiểu dữ liệu phần tử con.
- **Tách biệt logic (Clean Code):** Đảm bảo dữ liệu đi vào Task/Service luôn sạch và đầy đủ key cấu trúc.
- **Tài liệu hóa API:** Định hình sẵn cấu trúc (shape) của JSON payload trực quan ngay tại tầng Request.

## 1.8) JSON cast cho dynamic config, checklist, schedule

**Code mẫu:**

```php
// Trong Model: Tự động encode/decode JSON dưới nền
protected $casts = [
    'checklist' => 'array',
    'schedule' => 'array',
];

// Trong Migration
$table->json('checklist')->nullable();
$table->json('schedule')->nullable();
```

**Tệ (Thủ công hoặc sai cấu trúc):**

- Không cast, tự gọi `json_encode()` / `json_decode()` thủ công rải rác -> Dễ lỗi cú pháp.
- Tách bảng (hasMany) quá sớm cho mọi trường dữ liệu nhỏ, cấu hình linh hoạt -> Làm chậm hệ thống vì phải Join nhiều.

**Hay (Động & Tự động hóa):**

- **Ép kiểu tự động:** Đọc ra dạng Array PHP sạch và tự động encode ngược lại JSON khi lưu xuống DB.
- **Cấu hình động (Dynamic Config):** Lưu trữ dữ liệu cấu hình có cấu trúc tùy biến cao mà không cần thêm cột DB.
- **Giới hạn phạm vi:** Chỉ áp dụng khi dữ liệu sống chung vòng đời với bảng cha, không cần truy vấn/lọc độc lập trên các trường con bên trong JSON.

## 1.9) `updateQuietly()` khi cập nhật nội bộ trong model event

**Code mẫu:**

```php
$model->updateQuietly([
    'done' => $isDone,
    'completed_at' => $isDone ? now() : null,
]);
```

**Tệ (Gây vòng lặp vô hạn hoặc bỏ qua Eloquent):**

- Gọi `$model->update([...])` bên trong model event -> Dễ gây lặp vô hạn (infinite loop) vì kích hoạt event liên tục.
- Dùng raw DB query `DB::table('works')->update([...])` -> Mất đi các tính năng hữu ích của Eloquent (mutators, automatic timestamps...).

**Hay (Cập nhật yên lặng):**

- **Tránh lặp vô hạn:** Cập nhật DB trực tiếp mà không kích hoạt các event liên quan (`updated`, `saved`...).
- **Bảo toàn Eloquent:** Vẫn sử dụng Eloquent Syntax sạch đẹp thay vì phải hạ cấp xuống raw SQL.
- **Ngăn chặn side effect:** Tránh vô tình kích hoạt gửi email/notification hay broadcast realtime của các listener khác.

## 1.10) `Repository::instance()` / `builder()` cho secondary repository access

**Code mẫu:**

```php
// Lấy nhanh repository phụ (không cần inject qua constructor)
$project = ProjectRepository::instance()->find($data['project_id']);

// Lấy Eloquent Builder trực tiếp từ Repository để truy vấn phức tạp
$maxSort = WorkRepository::builder()->where('project_id', $projectId)->max('sort');
```

**Tệ (Inject bừa bãi hoặc gọi Model thô):**

- Nạp quá nhiều Repository phụ qua constructor -> Constructor phình to, khởi tạo đối tượng nặng nề.
- Gọi Model thô trực tiếp `Project::find(...)` -> Phá vỡ tính nhất quán kiến trúc của Repository Pattern.

**Hay (Cô lập truy vấn & Lazy loading):**

- **Dọn sạch Constructor:** Chỉ nạp Repository chính quản lý thực thể cốt lõi của Task.
- **Query Isolation (Reset Criteria):** Lệnh `instance()` tự động giải phóng toàn bộ bộ lọc (`resetModel()`, `resetScope()`) tránh lỗi dính Criteria cũ từ các truy vấn trước đó.
- **Lazy loading:** Chỉ khởi tạo repository phụ khi code thực thi chạm tới dòng gọi `instance()`.
- **Đồng bộ qua `builder()`:** Viết các hàm SQL tổng hợp (`max`, `sum`, `whereNull`...) trực tiếp từ Repository mà vẫn giữ nguyên ranh giới kiến trúc.

## 1.11) `fieldSearchable` + Criteria thay vì query filter rải rác

**Code mẫu:**

```php
// Trong Repository: Khai báo cấu hình các cột được phép lọc
protected $fieldSearchable = [
    'id' => '=',
    'project_id' => '=',
    'name' => 'like',
    'priority' => 'in',
    'status' => 'in',
];

// Trong Task: Tự động map filter từ URL và ép thêm điều kiện cứng ở backend
$repository = $this->addRequestCriteria()->repository;
$repository->pushCriteria(new ThisEqualThatCriteria('project_id', $data['project_id']));
return $repository->paginate();
```

**Tệ (Kiểm tra thủ công từng tham số):**

- Dùng nhiều lệnh `if ($request->name)` lặp đi lặp lại để xây dựng SQL query -> Gây lặp code (boilerplate), khó bảo trì khi thay đổi cấu trúc DB.

**Hay (Cấu hình hóa & Tự động lọc):**

- **Tự động dịch SQL:** `addRequestCriteria()` tự động phân tích query string trên URL để tạo câu truy vấn (hỗ trợ `=`, `like`, `in`, `and/or`...).
- **Cấu hình tập trung:** Danh sách trường cho phép tìm kiếm được quản lý tập trung ngay tại Repository.
- **Khóa cứng dữ liệu (Security):** Dễ dàng dùng `pushCriteria()` để áp các điều kiện bảo mật bắt buộc ở backend mà client không thể tự thay đổi qua tham số URL.

## 1.12) Domain permission method như `canView()` / `canEdit()`

**Code mẫu:**

```php
// Định nghĩa trong Model
public function canView($userId = null) {
    return $this->hasMember($userId ?: Auth::id());
}

// Sử dụng ở mọi layer (Controller, Task, Job, Queue...)
if (!$project->canView()) {
    throw new Exception(trans('error.access_denied'));
}
```

**Tệ (Policy hoặc check ID thủ công):**

- Dùng Policy `$this->authorize('view', $project)`: Ràng buộc chặt chẽ với HTTP context (Controller), không thể gọi được từ Job chạy ngầm hoặc CLI.
- Check ID thủ công `$project->user_id !== Auth::id()`: Lặp code, rải rác logic phân quyền, cực kỳ khó sửa đổi khi thay đổi nghiệp vụ.

**Hay (Domain Method):**

- **Độc lập ngữ cảnh (Context-free):** Chạy ở bất kỳ đâu (Task, Job, CLI) nhờ truyền `$userId` động, tự động fallback về `Auth::id()` khi nhận request HTTP.
- **Tập trung logic (Domain Encapsulation):** Logic phân quyền đặt ngay tại Model quản lý thực thể, giúp bảo trì và cập nhật tại một nơi duy nhất.
- **Code tự giải thích:** Trực quan và tự nhiên: `if (!$project->canView())`.

## 1.13) Custom Pivot model khi pivot có nghiệp vụ

**Code mẫu:**

```php
// 1. Định nghĩa Pivot Model tùy chỉnh (kế thừa Pivot)
class WorkspaceUser extends Pivot {
    protected $table = 'workspace_user';
    protected $casts = ['main' => 'boolean', 'active' => 'boolean']; // Auto-cast dữ liệu phụ
}

// 2. Sử dụng trong Model cha
return $this->belongsToMany(User::class, WorkspaceUser::getTableName(), 'workspace_id', 'user_id')
    ->using(WorkspaceUser::class)
    ->withPivot('role', 'main', 'active')
    ->withTimestamps();
```

**Tệ (Pivot ẩn danh mặc định):**

- Truy cập cột phụ thô sơ qua `$user->pivot->main` trả về dạng chuỗi (`"1"`/`"0"`) thay vì boolean.
- Khó kiểm soát logic nghiệp vụ, không thể bắt Model Events (`created`, `updated`) trực tiếp tại bảng trung gian khi thêm/sửa thành viên.

**Hay (Custom Pivot Model):**

- **Tự động ép kiểu:** Các thuộc tính bổ sung trên bảng pivot (như `main`, `active`) luôn được cast đúng kiểu logic.
- **Đóng gói hành vi (Domain Encapsulation):** Cho phép lắng nghe Model Events và xử lý logic nghiệp vụ riêng (như tự động gửi mail khi join workspace) ngay tại Model Pivot.
- **Source of truth:** Tên bảng pivot được quản lý tập trung qua `WorkspaceUser::getTableName()`.

**Rule viết `withPivot()` cho AI Agent:**

- Có cột phụ trên bảng pivot và code cần đọc qua `$model->pivot` thì khai báo rõ trong `withPivot(...)`.
- Có `created_at`/`updated_at` trên bảng pivot thì luôn thêm `withTimestamps()`.
- Pivot có `role`, `active`, `main`, status, event, casts hoặc rule nghiệp vụ thì luôn thêm `->using(CustomPivot::class)` và định nghĩa custom Pivot model.
- Cột boolean/status trên pivot phải có `$casts` trong custom Pivot model, không để Transformer tự ép kiểu.
- Điều kiện lọc theo pivot dùng `wherePivot(...)`/`wherePivotIn(...)`, không tự join hoặc lọc collection PHP nếu database lọc được.
- Pivot chỉ nối 2 bảng và không có cột phụ/nghiệp vụ thì có thể bỏ custom Pivot model.

## 1.14) Sort order tính ở backend bằng query có ngữ cảnh

**Code mẫu:**

```php
// Tính sort tự động cho công việc mới trong cùng project, cùng cấp cha
$data['sort'] = WorkRepository::builder()
    ->where('project_id', $project->id)
    ->whereNull('parent_id')
    ->max('sort') + 1;
```

**Tệ (Nhận từ client hoặc đếm mảng thô):**

- Nhận trực tiếp từ client `'sort' => $request->sort`: Rủi ro xung đột dữ liệu hiển thị (Data integrity) khi client truyền số thứ tự tùy ý.
- Đếm số lượng bản ghi `count($works) + 1`: Tính toán sai lệch hoàn toàn khi danh sách đang bị lọc (filter) hoặc phân trang (pagination).

**Hay (Backend tự tính theo scope nghiệp vụ):**

- **Toàn vẹn dữ liệu:** Backend hoàn toàn kiểm soát và đảm bảo tính duy nhất của thứ tự sắp xếp thông qua database query thực tế.
- **Chính xác theo ngữ cảnh (Context-aware):** Chỉ tính toán giá trị `sort` lớn nhất (`max`) giới hạn trong phạm vi scope cụ thể (như cùng dự án, cùng cấp cha).

## 1.15) Event DTO có cờ lifecycle thay vì đoán trong Listener

**Code mẫu:**

```php
class DeleteWorkEvent extends ParentEvent
{
    public $deleted = false;
    public $deleting = false;

    public function __construct(
        public mixed $work,
        public bool $force = false
    ) {
        $this->deleted = is_array($work);
        $this->deleting = !is_array($work);
    }
}
```

**Tệ (Listener tự đoán trạng thái):**

- Listener đọc `$event->work` rồi tự suy ra đang `deleting`, `deleted`, hay `force`.
- Rủi ro: cùng một event chạy ở `deleted`, `forceDeleting`, `forceDeleted` nhưng side effect bị lặp hoặc thiếu.

**Hay (DTO rõ lifecycle):**

- **Tường minh:** Event nói rõ đây là phase đang xóa hay đã xóa.
- **Listener đơn giản:** Listener chỉ check `$event->force`, `$event->deleted`, `$event->deleting`.
- **Hợp soft delete:** Soft delete cần array snapshot sau khi model đã xóa, force delete cần model object trước khi xóa để còn query quan hệ.

## 1.16) Listener subscriber map thay vì nhiều `$listen` rời rạc

**Code mẫu:**

```php
class BoardListener extends ParentListener
{
    public function handleUpdate(UpdateBoardEvent $event): void
    {
        // normalize works theo status/tag mới của board
    }

    public function subscribe()
    {
        return [
            UpdateBoardEvent::class => 'handleUpdate',
        ];
    }
}

class EventServiceProvider extends ParentEventServiceProvider
{
    protected $subscribe = [
        BoardListener::class,
    ];
}
```

**Tệ (Map event rải rác):**

- Mỗi event/listener nằm ở nhiều nơi, khó trace side effect theo domain.

**Hay (Subscriber theo domain listener):**

- **Đọc theo nghiệp vụ:** `BoardListener` của `Work` nói rõ Work phản ứng với Board.
- **Dễ review:** Mở `Providers/EventServiceProvider.php` thấy ngay container đang subscribe listener nào.
- **Dễ mở rộng:** Một listener có thể handle create/update/delete/restore của cùng upstream domain.

## 1.17) Chunk cascade thay vì load tất cả khi delete/restore

**Code mẫu:**

```php
BoardRepository::builder()
    ->onlyTrashed()
    ->where('workspace_id', $workspace->id)
    ->where('deleted_by_workspace', true)
    ->chunkById(100, function ($boards) {
        foreach ($boards as $board) {
            $board->restore();
        }
    });
```

**Tệ (Load toàn bộ):**

- Dùng `get()` cho cascade lớn như workspace -> boards -> projects -> works.
- Rủi ro: memory cao, timeout, force delete dở dang.

**Hay (Chunk theo batch):**

- **Ổn định production:** Mỗi batch nhỏ, ít memory.
- **Hợp purge job:** Repo có `force_delete = 7` và job purge hằng ngày, cascade phải chịu được dữ liệu lớn.
- **Dễ rollback tư duy:** Soft delete trước, force purge sau.

## 1.18) Snapshot field/payload để bảo toàn lịch sử

**Code mẫu:**

```php
$data = [
    'work' => [
        'id' => $work->id,
        'name' => $work->name,
    ],
    'user' => [
        'id' => $auth->id,
        'name' => $auth->name,
    ],
];
```

**Tệ (Chỉ lưu FK rồi join realtime):**

- Notification/log/order detail chỉ lưu `work_id`, `product_id`, `user_id`.
- Khi Work/Product/User đổi tên hoặc bị xóa, lịch sử cũ biến nghĩa hoặc không render được.

**Hay (Snapshot có chủ đích):**

- **Bảo toàn lịch sử:** Notification hiện có lưu `board/project/work/comment/user` dạng payload denormalized.
- **Ít phụ thuộc join:** UI đọc lịch sử không bắt buộc entity còn tồn tại.
- **Đúng với nghiệp vụ đơn hàng:** `OrderItem` nên lưu thẳng `product_name`, `product_price`, `sku`, thông tin người gửi/nhận tại thời điểm đặt hàng, không chỉ lưu FK.

## 1.19) SoftDelete flag theo nguyên nhân, không chỉ `deleted_at`

**Code mẫu:**

```php
$work->updateQuietly([
    'deleted_by_project' => true,
]);

$work->delete();

WorkRepository::builder()
    ->onlyTrashed()
    ->where('project_id', $project->id)
    ->where('deleted_by_project', true)
    ->chunkById(100, fn ($works) => /* restore đúng nhóm */);
```

**Tệ (Chỉ restore theo parent id):**

- Restore Project rồi restore toàn bộ Work đã xóa dưới Project.
- Rủi ro: khôi phục nhầm Work mà user đã tự xóa trước đó.

**Hay (Flag nguyên nhân):**

- **An toàn restore:** Chỉ restore child bị xóa bởi đúng parent action.
- **Trace được lifecycle:** `deleted_by_workspace`, `deleted_by_board`, `deleted_by_project`, `deleted_by_parent`, `deleted_by_user`.
- **Không nhầm soft delete với archive:** Soft delete là trạng thái có khả năng restore/purge, không phải nút “ẩn tạm”.

## 1.20) Transform từ relation đã load khi collection lớn

**Code nên ưu tiên:**

```php
'likes' => $comment->relationLoaded('likes')
    ? $comment->likes->pluck('user_id')->toArray()
    : $comment->likes()->pluck('user_id')->toArray(),
```

**Tệ (Query trong mỗi transform):**

- Trong collection comment, gọi `$comment->likes()->pluck()` và `$comment->viewers()->pluck()` từng item.
- 50 comments có thể thành 100 query phụ.

**Hay (Respect eager loading):**

- **Không phá list API:** Task có thể preload `likes`, `viewers` một lần.
- **Giữ backward compatible:** Vẫn fallback query khi transform single item.
- **Dễ tối ưu tiếp:** Khi cần chỉ boolean, dùng `withExists`; khi cần count, dùng `withCount`.

## 1.21) `afterCommit()` cho side effect phụ thuộc dữ liệu đã ghi

**Code mẫu:**

```php
$job = new CreateNotifyJob($auth, $this, $title, $message, $custom);

if ($afterCommit) {
    $job->afterCommit();
}

dispatch($job);
```

**Tệ (Bắn mail/socket trong transaction):**

- Gửi realtime/mail trước `DB::commit()`.
- Nếu rollback, client đã thấy dữ liệu “ma”.

**Hay (Side effect sau commit):**

- **Đúng thứ tự:** Core state commit trước, notification/socket sau.
- **Ít ghost event:** Listener queued có `public bool $afterCommit = true`.
- **Rõ intent:** Side effect nào có thể fail mà không rollback nghiệp vụ thì tách ra Job/Event.

## 1.22) `static::` trong Model static method thay vì hard-code class hiện tại

**Code mẫu:**

```php
public static function logoutAuthByIdAllDevices($userId)
{
    $user = static::find($userId);
}
```

**Tệ (Khóa cứng class):**

```php
public static function logoutAuthByIdAllDevices($userId)
{
    $user = User::find($userId);
}
```

- Method đang nằm trong `User` nhưng lại gọi cứng `User::find()`.
- Rủi ro: nếu sau này model có subclass/test double/custom user model gọi lại method này, query vẫn bị ép về `User`.

**Hay (Late static binding):**

- **Giữ đúng class đang gọi:** `AdminUser::logoutAuthByIdAllDevices()` sẽ dùng `AdminUser::find()` nếu có subclass.
- **Hợp với static method của Model:** Eloquent methods như `find`, `query`, `withTrashed` là inherited static calls, nên `static::` giữ tính mở rộng tốt hơn.
- **Dễ refactor:** Không phải sửa tên class ở trong chính class đó nếu đổi class hoặc tách base model.
- **Chỉ dùng khi muốn polymorphic:** Nếu nghiệp vụ cố ý luôn query đúng `User` gốc, lúc đó mới hard-code `User::class` hoặc `User::query()`.
