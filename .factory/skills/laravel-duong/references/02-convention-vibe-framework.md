# 2) Convention / Vibe Framework

Mục tiêu: giữ đúng “vibe code” của repo Laravel 9, Apiato, Porto. Ưu tiên:

1. Human readable.
2. AI agent đọc nhanh, làm đúng.
3. Ít token, không viết lan man.

## 2.1) Tinh thần chính

- Explicit over implicit.
- Method/class/object over magic string.
- Request là API contract.
- Model là source of truth cho table, cast, relation, domain permission.
- Controller mỏng.
- Action sanitize input.
- Task xử lý nghiệp vụ và database.
- Repository quản lý filter/query criteria.
- Transformer là response contract.
- Event/Job/Listener xử lý side effect.

## 2.2) Cấu trúc repo

```txt
app/Containers/{Section}/{Container}
app/Ship
```

- `AppSection`: nền tảng ứng dụng, auth, user, authorization, file, otp.
- `TodoSection`: domain chính, workspace, board, project, work, comment.
- `WrittenSection`: docs, welcome, broadcast.
- `Ship`: shared parent class, criteria, helper, provider, command, middleware.

Không thêm cấu trúc Next.js, Vite, React app mới, Shadcn, Tailwind, Convex, Bun nếu task không yêu cầu rõ.

## 2.3) Naming

| Thành phần                                      | Chuẩn                                                     |
| ----------------------------------------------- | --------------------------------------------------------- |
| Section, Container                              | `PascalCase`, ví dụ `TodoSection/Work`                    |
| PHP class/file                                  | `PascalCase`, ví dụ `CreateWorkAction.php`                |
| Method, biến, property                          | `camelCase`                                               |
| DB table, column, request field, response field | `snake_case`                                              |
| Route URI                                       | lowercase, RESTful, danh từ số nhiều                      |
| Route file                                      | `{ActionName}.v{version}.{visibility}.php`                |
| Config file                                     | `{section}-{container}.php`, ví dụ `todoSection-work.php` |

Ví dụ route file:

```txt
CreateWork.v1.private.php
UpdateUserPassword.v1.private.php
_works.v1.public.php
```

`_*.public.php` thường chứa `@apiDefine` response dùng chung.

## 2.4) Flow endpoint chuẩn

```txt
Route -> Controller -> Request -> Action -> Task -> Repository/Model -> Transformer
```

Khi tạo endpoint mới, đi đủ file theo flow. Không bỏ qua Request, Action hoặc Task vì “nhanh”.

Ví dụ CRUD API:

```txt
UI/API/Routes/CreateWork.v1.private.php
UI/API/Controllers/CreateWorkController.php
UI/API/Requests/CreateWorkRequest.php
Actions/CreateWorkAction.php
Tasks/CreateWorkTask.php
Data/Repositories/WorkRepository.php
Models/Work.php
UI/API/Transformers/WorkTransformer.php
```

## 2.5) Route

Route chỉ khai báo HTTP, URI, Controller method, middleware và `@api` docs.

```php
Route::post('todo/works', [CreateWorkController::class, 'createWork'])
    ->middleware(['auth:api']);
```

Quy ước:

- Private route thường có `auth:api`, nhưng không đoán theo tên file. Luôn đọc middleware.
- Nếu route có block `@api`, đổi contract thì cập nhật ngay tại route file.
- Không viết business logic trong route.

## 2.6) Controller

Controller phải mỏng:

```php
public function createWork(CreateWorkRequest $request): JsonResponse
{
    $work = app(CreateWorkAction::class)->run($request)->refresh();

    return $this->created($this->transform($work, WorkTransformer::class));
}
```

Controller chỉ:

- Nhận typed Request.
- Gọi đúng Action.
- Trả response qua Transformer.

Không query, validate, phân quyền nghiệp vụ hoặc mutate data trong Controller.

## 2.7) Request

Request là contract của endpoint:

- `$access`: permission/role.
- `$decode`: hash id cần decode.
- `$urlParameters`: route param cần đưa vào validation.
- `rules()`: validate payload.
- `authorize()`: gọi `$this->check(['hasAccess'])` hoặc rule tương ứng.

Ưu tiên:

```php
Rule::exists(Project::getTableName(), 'id')
Rule::unique(User::getTableName(), 'email')
```

Không ưu tiên:

```php
'exists:projects,id'
'unique:users,email'
```

Nested payload phải validate shape:

```php
'checklist' => 'nullable|array',
'checklist.*' => 'array:name,done',
'checklist.*.name' => 'max:200',
'checklist.*.done' => 'boolean',
```

Cẩn trọng: không copy typo hiện có như `pendding`. Nếu gặp, giữ scope task, không tự refactor lan rộng.

## 2.8) Action

Action là input boundary. Pattern chính:

```php
$data = $request->sanitizeInput([
    'project_id',
    'name',
    'requester_id' => Auth::id(),
]);

return app(CreateWorkTask::class)->run($data);
```

Quy ước:

- Dùng `sanitizeInput()` whitelist field.
- Gán server-owned field tại backend, ví dụ `Auth::id()`.
- Không dùng `$request->all()`.
- Không nhồi query và business rule nặng vào Action.
- SubAction được phép dùng khi là logic phụ, tái sử dụng rõ.

## 2.9) Task

Task xử lý nghiệp vụ, database, transaction, repository, relation sync.

Quy ước:

- Inject repository chính qua constructor.
- Dùng `DB::transaction()` hoặc `beginTransaction/commit/rollBack` khi ghi nhiều bước.
- Dùng `Repository::instance()` khi cần repository phụ.
- Dùng `Repository::builder()` khi cần query builder từ repository.
- Check domain permission qua model method như `canView()`, `canEdit()`.
- Không fetch toàn bộ rồi filter bằng PHP nếu DB filter được.

Ví dụ:

```php
$project = ProjectRepository::instance()->find($data['project_id']);
if (!$project->canView()) {
    throw new Exception(trans('error.access_denied'));
}
```

Lưu ý vibe repo: `TodoSection` thường đặt orchestration khá nhiều trong Task. Khi sửa code, match pattern file hiện tại trước, không áp lý thuyết máy móc.

## 2.10) Repository và Criteria

Repository khai báo field được phép search/filter:

```php
protected $fieldSearchable = [
    'id' => '=',
    'name' => 'like',
    'status' => 'in',
];
```

List Task ưu tiên:

```php
$repository = $this->addRequestCriteria()->repository;
return $repository->paginate();
```

Custom criteria dùng để khóa điều kiện backend:

```php
$repository->pushCriteria(new ThisEqualThatCriteria('project_id', $projectId));
```

Vibe:

- Filter public từ URL qua `fieldSearchable`.
- Filter bảo mật/ownership bằng `pushCriteria()`.
- Query quan hệ bằng `WithRelationshipCriteria`.
- Pagination mặc định cho list API.

## 2.11) Model

Model là source of truth:

```php
protected $fillable = [];
protected $hidden = [];
protected $casts = [];
protected $table = 'works';
protected string $resourceKey = 'Work';

public static function getTableName()
{
    return 'works';
}
```

Quy ước:

- Migration, validation, relation pivot dùng `Model::getTableName()`.
- JSON column phải có cast tương ứng.
- Relationship method dùng `camelCase`.
- Domain permission đặt tại model: `canView()`, `canEdit()`, `canDelete()`.
- Default eager-load có thể dùng named global scope như `withDefault`.
- Trong model event, dùng `updateQuietly()` nếu update nội bộ để tránh loop event.

## 2.12) Pivot model

Khi pivot có role, active, main, event, timestamps hoặc nghiệp vụ riêng, tạo custom Pivot model.

```php
return $this->belongsToMany(User::class, WorkspaceUser::getTableName(), 'workspace_id', 'user_id')
    ->using(WorkspaceUser::class)
    ->withPivot('role', 'main', 'active')
    ->withTimestamps();
```

Vibe:

- Membership là domain concept, không chỉ là bảng nối.
- Pivot model có `$casts`, `booted()`, event cleanup nếu cần.
- `withPivot(...)` liệt kê đúng các cột phụ mà API/permission/logic sẽ đọc qua `$model->pivot`.
- `withTimestamps()` bắt buộc khi bảng pivot có `created_at`/`updated_at`.
- `wherePivot(...)`/`wherePivotIn(...)` dùng cho filter pivot ở database, không load hết rồi filter bằng PHP.
- Không tạo Container riêng cho pivot nếu pivot chỉ là membership thuộc aggregate cha.
- Pivot đơn thuần chỉ có 2 khóa ngoại thì không cần custom Pivot model.

## 2.13) Transformer

Transformer là public API contract:

```php
return [
    'object' => $work->getResourceKey(),
    'id' => $work->getHashedKey(),
    'name' => $work->name,
    'can-edit' => $work->canEdit($userId),
];
```

Quy ước:

- Response key ưu tiên `snake_case`, nhưng repo có một số key legacy như `can-edit`.
- Dùng `availableIncludes` và `include{Relation}()`.
- Dùng `ifAdmin()` cho `real_id`, `created_at`, `updated_at` nếu pattern hiện có.
- Không trả thẳng model array ra API.
- Khi main `id` đang hash nhưng foreign key còn raw, match Transformer hiện tại, không tự đổi contract nếu task không yêu cầu.

## 2.14) Event, Job, Listener, Realtime

Side effect nên tách khỏi endpoint chính:

- Event: domain happened, ví dụ `DeleteWorkEvent`.
- Realtime event: gửi socket payload, ví dụ `UpdateWorkRealtime`.
- Listener: cascade side effect giữa container.
- Job: xử lý async, notification, cleanup file, purge soft-deleted data.

Quy ước:

- Container có `Providers/EventServiceProvider.php` để subscribe listener.
- `MainServiceProvider.php` register provider của container.
- Side effect sau ghi DB nên ưu tiên after commit khi có thể.
- Realtime payload nên đi qua Transformer, không tự build lung tung.

## 2.15) Config

Domain default đặt trong container config:

```php
config('todoSection-work.priorities')
config('todoSection-board.tags_default')
```

Không hardcode list lớn trong Task nếu đã có config phù hợp.

## 2.16) Migration

Ưu tiên explicit table và FK:

```php
Schema::create(Work::getTableName(), function (Blueprint $table) {
    $table->unsignedBigInteger('project_id');
    $table->foreign('project_id')->references('id')->on(Project::getTableName())->cascadeOnDelete();
});
```

Quy ước:

- Table/column dùng `snake_case`.
- JSON column đi kèm cast ở Model.
- Dùng `cascadeOnDelete()` hoặc `nullOnDelete()`, không dùng magic string `onDelete('cascade')`.
- Thêm index khi query pattern mới filter/sort nhiều.

## 2.17) Không làm

- Không đưa business logic vào Controller hoặc Route.
- Không dùng `$request->all()` cho Action.
- Không hardcode table string nếu có Model.
- Không tự ý đổi response contract.
- Không query bằng Model thô nếu container đang theo Repository pattern.
- Không fetch all rồi filter bằng PHP.
- Không thêm shared code vào `Ship` nếu chỉ dùng một container.
- Không format/refactor file lân cận ngoài scope.

## 2.18) Checklist cho AI agent trước khi sửa

1. Xác định Container và flow file hiện có.
2. Đọc Request, Action, Task, Repository, Model, Transformer liên quan.
3. Match naming và pattern file gần nhất.
4. Nếu thêm field, cập nhật Request, Action sanitize, Model fillable/casts, Migration, Transformer nếu là response field.
5. Nếu thêm list filter, cập nhật Repository `$fieldSearchable` và Task criteria nếu cần khóa quyền.
6. Nếu thêm quyền nghiệp vụ, ưu tiên domain method ở Model.
7. Nếu thêm side effect, cân nhắc Event/Listener/Job.
8. Chạy validator phù hợp trước khi bàn giao hoặc commit.

## 2.19) Cẩn trọng đã quan sát

- File `.private.php` không luôn đảm bảo có `auth:api`. Luôn đọc route middleware.
- `TodoSection` có Task orchestration dài. Khi refactor, tránh chia nhỏ nếu task không yêu cầu.
- Một số docs/response key có legacy style. Không tự chuẩn hóa hàng loạt.
- Test suite trong repo mỏng, nên review diff và chạy validator phù hợp kỹ hơn.

## 2.20) Container và aggregate theo vibe “1 model chính = 1 container”

Quy ước sư phụ Dương nói “1 model là 1 container” nên hiểu theo **model chính có nghiệp vụ độc lập**, không hiểu máy móc là mọi table đều thành container.

Observation:

- `Workspace`, `Board`, `Project`, `Work`, `Comment` là các container riêng trong `TodoSection`.
- `WorkFile`, `WorkLog`, `WorkHistory`, `WorkReview`, `WorkUser`, `WorkViewer`, `WorkFollower` vẫn nằm trong container `Work`.
- `CommentLike`, `CommentViewer` vẫn nằm trong container `Comment`.

Inference:

- Tách container khi model có endpoint/lifecycle/quyền/owner/business vocabulary riêng.
- Giữ trong aggregate khi table sống chết theo model cha, không có use case độc lập, chủ yếu là child, pivot, log, history, file, review item.

Decision:

```txt
Primary domain model -> Container riêng.
Aggregate child/pivot/log/snapshot -> nằm trong Container cha.
Cross-cutting capability như Notification/File/User/Auth -> AppSection hoặc Ship tùy mức dùng chung.
```

Ví dụ thiết kế mới:

- `Order` là container chính nếu có API đặt hàng, thanh toán, trạng thái, quyền riêng.
- `OrderItem` thường nằm trong `Order`, vì sống chết theo Order và cần snapshot sản phẩm.
- `Payment` tách container nếu có lifecycle thanh toán, webhook, retry, reconciliation riêng.

## 2.21) Event/Listener boilerplate của repo

Khi thêm side effect theo boilerplate này:

```txt
{Container}/Events/{Verb}{Model}Event.php
{Container}/Listeners/{UpstreamDomain}Listener.php
{Container}/Providers/EventServiceProvider.php
{Container}/Providers/MainServiceProvider.php
```

Pattern:

- Event extends `App\Ship\Parents\Events\Event`.
- Listener extends `App\Ship\Parents\Listeners\Listener`.
- Listener dùng `subscribe()` trả về `[EventClass::class => 'handleMethod']`.
- Container `EventServiceProvider` khai báo `$subscribe`.
- Container `MainServiceProvider` register `EventServiceProvider::class`.

Rule:

- Event domain là dữ liệu đã xảy ra, nên nhỏ và rõ payload.
- Listener xử lý side effect/cascade, không thay core write bắt buộc nếu endpoint cần consistency ngay.
- Realtime event trong repo là ngoại lệ có thể query và gửi trong constructor, phải audit transaction order.
- Listener slow/external nên queued và `afterCommit`.

## 2.22) SoftDelete là convention cho aggregate cha có restore/purge

Repo dùng SoftDelete cho:

```txt
Workspace, Board, Project, Work, User
```

Repo không dùng SoftDelete cho nhiều bảng con:

```txt
Comment, CommentLike, CommentViewer, WorkFile, WorkLog, WorkHistory, WorkUser
```

Decision:

- Dùng SoftDelete khi entity là business record quan trọng, có restore, recycle bin, hoặc cần purge sau vài ngày.
- Không dùng SoftDelete cho pivot/viewer/like/log/file nếu dữ liệu chỉ là phụ thuộc, có cleanup rõ hoặc log đã là lịch sử.
- Nếu parent soft delete cần restore child đúng nguyên nhân, thêm `deleted_by_*` flag.
- Nếu không restore được đúng nghĩa, đừng thêm SoftDelete chỉ vì “an toàn”.

## 2.23) Snapshot/denormalized field là convention cho lịch sử

Các notification trong repo lưu payload dạng snapshot:

```txt
board.id/name/type
project.id/name
work.id/name
comment.id/content
user.id/name
```

Vibe áp dụng:

- Dữ liệu lịch sử phải đọc được kể cả record gốc đổi tên hoặc bị xóa.
- Nếu payload cần phản ánh tên mới, tạo listener update denormalized data như `Notification\Listeners\WorkListener`.
- Nếu nghiệp vụ yêu cầu giữ đúng thời điểm phát sinh, không update snapshot cũ.
- Với đơn hàng, giao dịch, phiếu thu, shipment, audit log: lưu snapshot thẳng vào model fields, ví dụ `product_name`, `product_price`, `receiver_name`, `receiver_phone`, `sender_address`.

## 2.24) Convention chống N+1

Vibe repo đã có nhiều eager load chủ động:

- `Work` global scope load `files`, `userIds`, `viewerIds`, `followerIds`, `comments_count`.
- List Task thường `with(['project.board.workspace'])`.
- Realtime payload transform theo từng user nên càng phải preload relation trước khi dispatch.

Rule:

- Transformer collection không được tự tạo query per item nếu Task có thể preload.
- `includeStatistic` và các `count()` trong Transformer chỉ nên dùng cho single/detail hoặc phải gom aggregate ở Task.
- Permission method gọi relation/query như `canEdit()` phải được soi khi chạy trong collection.
- Khi thêm include mới, kiểm tra query count bằng Telescope/debug query log nếu có thể.
