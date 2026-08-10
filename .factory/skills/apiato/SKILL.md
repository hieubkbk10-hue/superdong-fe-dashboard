---
name: apiato
version: 1.3.0
description: |
  Use when creating, reviewing, or debugging Laravel Apiato 11.x Porto APIs, including Authentication, Laravel Passport, OAuth2, token lifecycle, Containers, Actions, Tasks, Requests, Repositories, Transformers, CRUD endpoints, Hash ID handling, RequestCriteria, and Apiato/Laravel backend architecture.
---

# Apiato 11.x Porto API Skill

## Overview

Use Apiato as Laravel plus Porto architecture: business code belongs in Containers, shared infrastructure belongs in Ship, and endpoints should stay thin around a clear use case.

Core flow:

```txt
Route -> Controller -> Request -> Action -> SubAction -> Task -> Repository/Model -> Transformer
```

`SubAction` is optional. Use it only for reusable sub-use-cases that would otherwise make an Action too large or force a Task to orchestrate other Tasks.

## When to Use

Use this skill when working on:

- Apiato 11.x CRUD endpoints, API routes, Requests, Actions, SubActions, Tasks, Repositories, Models, Transformers, Events, Listeners, Jobs, Policies, Tests, Migrations, or Providers.
- Authentication with Laravel Passport, OAuth clients/grants, proxy login, refresh tokens, logout/revocation, `auth:api`, token expiration, email verification, password reset, or Social Authentication.
- Laravel/Apiato Porto design decisions, especially Container boundaries, section placement, RequestCriteria, Hash ID, `fieldSearchable`, validation, authorization, pagination, includes, and API response shape.
- Code review or debugging of an endpoint that should follow `Route -> Controller -> Request -> Action -> Task`.

When not to use:

- Plain Laravel MVC code that is intentionally outside Apiato/Porto.
- Apiato 12.x or 13.x specific migrations unless the user explicitly asks for upgrade guidance.
- Frontend-only work, except when defining the backend API contract.

## Docs vs Repo Overrides

Apiato 11.x docs are the baseline. This repo can be stricter. If they conflict, state the distinction:

| Topic                     | Apiato 11.x docs                                                                                                                | Repo/company policy                                                                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Controller shape          | API Controller extends `App\Ship\Parents\Controllers\ApiController`; docs show `UI/API/Controllers/Controller.php` with methods | This repo may use one controller file per endpoint if existing container does. Match nearby code first                                                                                                                |
| Controller responsibility | Controller should only call Action `run()` and pass the Request object                                                          | Keep controller thin, no query or orchestration                                                                                                                                                                       |
| Transaction               | `transactionalRun(...$arguments)` wraps Action `run()` and docs say it is commonly called from Controller                       | Multi-write workflow consistency must be explicit. Use `transactionalRun()` from Controller when fitting docs, or `DB::transaction()`/transactional orchestration at Action level when repo pattern already does that |
| Events                    | Events may fire from Actions or Tasks; docs recommend choosing one place and say Tasks are recommended                          | For multi-write workflows, dispatch only after successful state change, and use after-commit semantics for queued/external side effects                                                                               |
| Validators                | Apiato docs do not define this repo's validators                                                                                | Follow `AGENTS.md`: `composer validate --strict`, `vendor/bin/php-cs-fixer fix --config=php_cs.dist.php --dry-run --diff`, `vendor/bin/psalm --config=psalm.dist.xml`, `vendor/bin/phpunit` as relevant               |

## Quick Reference

| Component      | Location                                    | Extends                                      | Primary rule                                                                                |
| -------------- | ------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Route          | `UI/API/Routes`                             | n/a                                          | File name `{ActionName}.v{n}.{public                                                        | private}.php`; private routes use auth middleware |
| Controller     | `UI/API/Controllers`                        | `App\Ship\Parents\Controllers\ApiController` | Accept Request, call Action, return response/Transformer                                    |
| Request        | `UI/API/Requests`                           | `App\Ship\Parents\Requests\Request`          | `rules(): array`, `authorize(): bool`, `$access`, `$decode`, `$urlParameters`               |
| Action         | `Actions`                                   | `App\Ship\Parents\Actions\Action`            | Top-level use case orchestration                                                            |
| SubAction      | `Actions`                                   | `App\Ship\Parents\Actions\SubAction`         | Reusable sub-use-case orchestration                                                         |
| Task           | `Tasks`                                     | `App\Ship\Parents\Tasks\Task`                | One small reusable job, no Request object                                                   |
| Repository     | `Data/Repositories`                         | `App\Ship\Parents\Repositories\Repository`   | Data access and query parameter surface                                                     |
| Model          | `Models`                                    | parent model used by repo                    | Table representation, fillable/casts/relationships                                          |
| Transformer    | `UI/API/Transformers`                       | `App\Ship\Parents\Transformers\Transformer`  | Public API shape, hashed IDs, includes                                                      |
| Event          | `Events` or `Ship/Events`                   | `App\Ship\Parents\Events\Event`              | Data carrier for decoupled side effects                                                     |
| Listener       | `Listeners`                                 | `App\Ship\Parents\Listeners\Listener`        | One side effect, queue if slow/external                                                     |
| Test           | `Tests/Unit`, `UI/API/Tests/Functional`     | container TestCase                           | Unit for Action/Task, Functional for Route                                                  |
| Authentication | Authentication Container + Ship auth config | Passport/OAuth2                              | Keep client secrets server-side; test issue, refresh, revoke, guards, scopes and expiration |

Detailed authentication reference: [references/authentication-passport.md](references/authentication-passport.md).

## Porto Mental Model

Apiato is not classic MVC. Think in **business domains** and **single-responsibility layers**.

- **Container** = business domain / bounded context, not necessarily one model.
- **Section** = group of related Containers. `AppSection` is Apiato's default section.
- **Ship** = infrastructure and code shared across Containers.
- **Model** = database table representation.
- **Action** = one complete use case.
- **SubAction** = reusable sub-use-case used by Actions or SubActions.
- **Task** = one reusable small job.
- **Repository** = data access adapter and query criteria surface.
- **Transformer** = public JSON response shape.
- **Event/Listener** = decouple side effects from core use case.

Container guidance:

- Default section for this repo/company style: `AppSection`.
- Container name uses `PascalCase`, often the most important model or domain: `User`, `Order`, `Payment`.
- A Container can include many Models, one Model, or no Model.
- Do not create a new Container just because there is a new table.
- Keep entities together when they share lifecycle/context, for example `Order`, `OrderItem`, `OrderHistory`.
- Split independent capabilities into separate Containers, for example `Payment`, `Notification`, `Chat`.

## Starting a Feature

1. Identify resources/models, REST endpoints, payloads, response shape, permissions, and frontend states.
2. Decide Container by business domain and match existing nearby code.
3. Plan Action/SubAction/Task split before writing code.
4. Treat production requirements as design inputs: indexes, pagination, authorization, validation caps, rollback, rate limits, query shape, and API docs.
5. Add or update tests for success, validation failure, unauthorized, not found, and important edge cases.

## Production Rules

- **Request is the gate**: validate, authorize, decode Hash IDs, cap strings, and cap list query params before Action.
- **Controller stays thin**: pass Request to Action; do not query DB or orchestrate business logic.
- **Action owns the use case**: it may call Tasks and SubActions, and may use `transactionalRun()`/transaction boundaries for multi-write workflows.
- **SubAction is orchestration only**: use it to avoid God Actions, not as a substitute for Tasks.
- **Task stays atomic**: one small reusable job, no Request object, no Action calls, no broad workflow transaction.
- **Repository is the query contract**: expose only safe searchable fields through `$fieldSearchable`.
- **Transformer is public contract**: return `getHashedKey()` IDs, hide internals/secrets, define includes before frontend uses them.
- **List APIs paginate**: no unbounded `all()` or `get()` for user-facing lists.
- **Index query patterns**: every foreign key, frequent filter, sort, and compound filter+sort should have a migration index.
- **Events are side-effect boundaries**: notifications, audit logs, cache invalidation, broadcasts, indexing, webhooks, and integrations. Do not hide required core writes only in a Listener.

## Layer Rules

### Route

- Location: `UI/API/Routes`.
- File pattern: `{ActionName}.v1.private.php` or `{ActionName}.v1.public.php`.
- Private routes use auth middleware/guard.
- REST URI uses lowercase plural nouns, version is part of the API URL, and GET must not change state.
- **Quy tắc viết DocBlock cho tài liệu API (`apidoc`)**:
  - Nếu repo/container đang dùng Documentation Generator, viết DocBlock `@api` đầy đủ ở đầu route mới và cập nhật khi behavior endpoint đổi.
  - Dùng đúng thẻ để tránh warning: `@apiParam` cho URL param, `@apiBody` cho JSON/body, `@apiQuery` cho query string.
  - Chạy lệnh `php artisan apiato:apidoc` đầu ra phải sạch sẽ, không có bất kỳ warning nào.
  - Ví dụ shape tối thiểu:
    ```php
    /**
     * @apiGroup           Order
     * @apiName            UpdateOrder
     *
     * @api                {PATCH} /v1/orders/:id Update Order
     * @apiDescription     Cập nhật thông tin đơn hàng
     * @apiHeader          {String} accept=application/json
     * @apiHeader          {String} authorization=Bearer
     * @apiParam           {String} id ID của đơn hàng nằm trên URL (bắt buộc)
     * @apiBody            {String} [shipping_carrier] Field body
     * @apiQuery           {String} [include] Query include
     */
    ```
- If route has `@api` docs, update it when endpoint behavior changes.

### Request

- Location: `UI/API/Requests`.
- One Request per endpoint.
- Must define `rules(): array` and `authorize(): bool`.
- Use:
  - `$access` for roles/permissions.
  - `$decode` for hashed IDs from body/query.
  - `$urlParameters` for route params like `{id}`.
- Put route ID in both `$urlParameters` and `$decode` when validating hashed URL IDs.
- Pass Request object to Action. Use `sanitizeInput([...])` in Actions for create/update payload allowlisting.
- Use `getInputByKey()` when you need decoded values instead of raw input.
- Use `mapInput([...])` only when deliberately remapping request keys for downstream logic.
- Always cap strings with `max`, especially create/update fields.
- Use `sometimes` validation rule for fields in Update Requests to allow partial resource updates.
- Validate list query params: `limit`, `page`, `search`, `searchFields`, `orderBy`, `sortedBy`, `filter`, `include`.
- For create/update, align validation max lengths with database column lengths.
- For private endpoints, never leave `authorize()` as `true` unless intentionally public-to-authenticated and documented.

### Controller

- Keep thin.
- API controller extends `App\Ship\Parents\Controllers\ApiController`; Web controller extends `App\Ship\Parents\Controllers\WebController`.
- Accept Request, call Action `run()` or `transactionalRun()`, return response/Transformer.
- Prefer passing the whole Request object to Action, matching docs and repo patterns.
- No DB query, no business orchestration.
- Use response helpers such as `transform`, `withMeta`, `json`, `accepted`, `deleted`, and `noContent` when appropriate.

### Action

- Orchestrates use case.
- Bắt buộc lập kế hoạch và phân rã đầy đủ các Task cần thiết trước khi viết Action.
- Calls Tasks and optionally SubActions. Điều phối qua Task/SubAction, không viết logic truy vấn DB hay xử lý Eloquent trực tiếp trong Action.
- May receive Request object.
- For create/update, use `$request->sanitizeInput([...])`.
- Use `transactionalRun(...$arguments)` where it fits Apiato docs. If repo pattern uses `DB::transaction()` inside Action, keep the transaction at use-case orchestration level.
- Throw meaningful Apiato/Ship exceptions.

### SubAction

- Location: `Actions`.
- Extends `App\Ship\Parents\Actions\SubAction`.
- Use for reusable sub-use-cases with business orchestration.
- Can call multiple Tasks and other SubActions.
- Do not create SubAction for a single repository call. That belongs in a Task.
- Do not expose SubAction as an endpoint-level use case. That belongs in an Action.

### Task

- One small job (Single Responsibility Principle - SRP).
- Extends `App\Ship\Parents\Tasks\Task`.
- Phân rã triệt để: Khi thực hiện một luồng nghiệp vụ phức tạp, tạo Task nhỏ độc lập như tìm chi tiết, tạo mới, trừ kho, ghi log, thay vì gom nhiều logic khác nhau vào một Task.
- Do not accept Request object.
- Do not call Action.
- Do not call Task from Task unless nearby repo code explicitly has that pattern and there is no cleaner SubAction.
- Use Repository for data access.
- Catch DB/library failures and throw standard exceptions.
- Do not start broad workflow transactions in Task. Only use local transaction in a Task for a truly atomic low-level data operation that cannot be split.

### Repository

- Location: `Data/Repositories`.
- Extends `App\Ship\Parents\Repositories\Repository`.
- A Model should normally have a Repository.
- Access Models through Repositories in Tasks.
- Use `model(): string` when model/container names differ.
- Repository is the frontend-friendly query surface via RequestCriteria and `$fieldSearchable`.

### Transformer

- Return public API shape only.
- API responses should be formatted through Transformers.
- Use `$model->getHashedKey()` for IDs.
- Do not leak password, token, secret, internal IDs, system-only flags.
- Define `$availableIncludes` / `$defaultIncludes`.
- Relationship include method: `include{RelationName}()`.
- Use `item()` for single relationships, `collection()` for multi relationships, and `nullableItem()` for nullable relationships.
- `ifAdmin($adminResponse, $clientResponse)` may expose safe admin-only metadata. Never expose secrets.
- Do not run heavy DB queries inside Transformer.

### Event and Listener

- Events are Laravel events with Apiato placement/rules.
- Event location: `{Container}/Events` or `Ship/Events` for truly global events.
- Listener location: `{Container}/Listeners`.
- Event class extends `App\Ship\Parents\Events\Event`.
- Listener class extends `App\Ship\Parents\Listeners\Listener`.
- Register event/listener mappings in a container EventServiceProvider, then register that provider in the container `MainServiceProvider`.
- Apiato docs allow firing events from Actions or Tasks, recommend choosing one place, and mention Tasks as recommended. For production code:
  - Prefer firing domain events after the state change succeeds.
  - If the Action owns a DB transaction, dispatch after the transaction commits or use queued listeners with `$afterCommit = true`.
  - Do not dispatch side effects before a transaction can still roll back.
- Use Events/Listeners for side effects:
  - notification/email/SMS
  - audit/activity log
  - cache invalidation
  - search indexing
  - webhook/integration
  - broadcast/realtime
- Do not use Listeners for required core writes that must be immediately consistent with the main use case.
- Slow or external listeners should implement `ShouldQueue`, set queue/retry/failure policy, and be idempotent.

## RequestCriteria Search/Filter API

Use RequestCriteria for list APIs so frontend can search/sort/filter without many custom endpoints, but keep the allowed surface small and indexed.

```php
protected $fieldSearchable = [
    'name' => 'like',
    'id' => '=',
    'email' => '=',
    'email_verified_at' => '=',
    'created_at' => 'like',
];
```

Docs-correct pattern: apply RequestCriteria to the Task from the Action, then the Task uses its injected Repository.

```php
class GetAllUsersAction extends Action
{
    public function run()
    {
        return app(GetAllUsersTask::class)->addRequestCriteria()->run();
    }
}

class GetAllUsersTask extends Task
{
    public function __construct(
        protected UserRepository $repository,
    ) {
    }

    public function run()
    {
        return $this->repository->paginate();
    }
}
```

Common frontend query params:

```txt
?search=John
?search=name:John
?search=name:John;email:john@example.com
?searchFields=name:like;email:=
?searchJoin=and
?orderBy=created_at&sortedBy=desc
?filter=id;name;email
?include=roles,permissions
?limit=20&page=2
```

Important:

- `search` works only when RequestCriteria is applied.
- Only allow safe fields in `$fieldSearchable`.
- Default search condition is `=`, use `like` only when partial matching is needed.
- Add DB indexes for searchable/sortable fields used often.
- Validate/cap `limit`, never allow unbounded list responses.
- For hashed search fields, pass decode fields to `addRequestCriteria(null, ['field_id'])`; `id` is decoded by default in Apiato docs.
- Includes require Transformer include definitions and real model relationships.
- `filter` filters Transformer output fields too.
- `searchJoin=and` switches search conditions from OR to AND.
- `skipCache=true` only works when Eloquent query cache is enabled and should not be encouraged for frequent use.

## Hash ID

- Enable with `HASH_ID=true`.
- Return IDs with `getHashedKey()`.
- Decode incoming hashed IDs through Request `$decode`.
- Route params need `$urlParameters`.
- Tests should send hashed IDs, e.g. model `getHashedKey()` or test helper `injectId()`.
- `getHashedKey()` returns the normal ID if Hash ID is disabled, so use it consistently.
- Never change `HASH_ID_KEY` in production because old IDs will no longer decode.
- `HASH_ID_LENGTH` controls length. `HASH_ID_KEY` defaults to `APP_KEY` when not set.
- `Apiato\Core\Traits\HashIdTrait` provides encode/decode helpers to models or classes. Tests and controllers have `$this->encode($id)` and `$this->decode($id)`.

## Event/Listener best practices

Use Event/Listener when adding the side effect directly to Action/Task would create coupling.

Good event names:

```txt
UserRegisteredEvent
OrderPaidEvent
BookCreatedEvent
PasswordUpdatedEvent
```

Good listener names:

```txt
SendWelcomeEmailListener
WriteOrderAuditLogListener
ClearProductCacheListener
SyncOrderToCrmListener
BroadcastOrderPaidListener
```

Registration shape:

```php
protected $listen = [
    OrderPaidEvent::class => [
        SendOrderPaidNotificationListener::class,
        WriteOrderAuditLogListener::class,
    ],
];
```

Queued listener shape:

```php
class SendOrderPaidNotificationListener extends ParentListener implements ShouldQueue
{
    public bool $afterCommit = true;
    public int $tries = 3;
    public string $queue = 'listeners';

    public function handle(OrderPaidEvent $event): void
    {
        // side effect only
    }
}
```

Rules:

- Event should be a small data carrier, no business logic.
- Prefer passing model ID or minimal immutable payload for queued/external side effects.
- Listener `handle()` should call Action/Task/service if it needs business/data access logic.
- Listener should be idempotent because queued listeners can retry.
- Add tests with `Event::fake()` for dispatch and listener tests for side effects.
- In production deploys using event discovery/cache, remember `php artisan event:cache` / `event:clear` as appropriate.

## API Documentation Generator

If the project uses the documentation generator:

- Install/source package is `apiato/documentation-generator-container`.
- Run `php artisan apiato:apidoc` after changing route DocBlocks.
- Apiato docs show `@apiParam` for request params in examples. This repo additionally distinguishes `@apiParam`, `@apiBody`, and `@apiQuery` to keep generated docs warning-free.
- Do not create README/docs files unless the user asks. Keep API docs in route DocBlocks if they already exist in the repo.

## CRUD checklist

- Migration: table/column naming, constraints, indexes, FK delete behavior, soft delete if needed.
- Model: `$fillable`, `$casts`, `$hidden`, relationships.
- Request: validation, authorization, `$decode`, `$urlParameters`, query param caps.
- Action: `sanitizeInput`, orchestration, `transactionalRun()` or explicit transaction if multi-write.
- SubAction: only for reusable sub-use-case orchestration.
- Task: repository calls, exceptions, no Request.
- Repository: model binding, `$fieldSearchable`, pagination.
- Transformer: hashed ID, safe fields, includes.
- Events/Listeners: side effects, queue, after-commit, idempotency.
- Tests: success, validation fail, unauthorized, not found, edge case.

## Migration and model checklist

- Table name plural `snake_case`; columns `snake_case`.
- Define proper column type, nullable, default, unique, precision.
- Add indexes at migration time for foreign keys, `where`, `orderBy`, and common compound filters.
- Define FK delete behavior deliberately: cascade, set null, or restrict.
- Use `softDeletes()` for important business records when deletion history matters.
- Model must define `$fillable`; avoid `$guarded = []`.
- Model should define `$casts`, `$hidden`, and relationships.

## Performance and safety

- No `all()` for list APIs.
- Use pagination/limit.
- Filter in DB, not PHP after fetch.
- Watch N+1 and eager load where needed.
- Index filters/sorts.
- Do not call DB in loops if batch is possible.
- Do not log secrets.
- Do not expose raw SQL errors.
- Use Telescope/Debugbar/query logs for query count and N+1 checks before production.
- Add rate limits for login, forgot password, search-heavy, import/export, and abuse-prone endpoints.
- Cache only when cache key, permissions, invalidation, and data freshness are clear.

## Frontend integration contract

- API response shape must be stable enough for TypeScript types.
- Support UI states: loading, error, empty, success, unauthorized.
- Return validation errors in a form-friendly shape.
- Do not make frontend depend on raw database IDs or internal DB columns.
- RequestCriteria endpoints should document allowed search/filter/order/include fields for frontend.

## Code Generator Reminders

Apiato 11.x docs list generators such as:

```txt
php artisan apiato:generate:container
php artisan apiato:generate:container:api
php artisan apiato:generate:container:web
php artisan apiato:generate:action
php artisan apiato:generate:subaction
php artisan apiato:generate:task
php artisan apiato:generate:request
php artisan apiato:generate:controller
php artisan apiato:generate:route
php artisan apiato:generate:model
php artisan apiato:generate:repository
php artisan apiato:generate:transformer
php artisan apiato:generate:migration
php artisan apiato:generate:factory
php artisan apiato:generate:seeder
php artisan apiato:generate:event
php artisan apiato:generate:listener
php artisan apiato:generate:job
php artisan apiato:generate:mail
php artisan apiato:generate:notification
php artisan apiato:generate:middleware
php artisan apiato:generate:policy
php artisan apiato:generate:provider
php artisan apiato:generate:readme
php artisan apiato:generate:configuration
php artisan apiato:generate:exception
php artisan apiato:generate:value
php artisan apiato:generate:test:functional
php artisan apiato:generate:test:unit
php artisan apiato:generate:test:testcase
```

Use `php artisan` and `php artisan apiato:generate:<name> --help` before relying on exact flags. All generators inherit common options such as `--section`, `--container`, and `--file`; some have extra options like `--ui`.

## Common Mistakes

| Mistake                                                                | Correction                                                                                       |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Creating one Container per table                                       | Create Containers by business domain/context                                                     |
| Treating docs examples as this repo's exact structure                  | Match nearby repo patterns after checking Apiato 11.x baseline                                   |
| Writing queries in Controller or Action                                | Put data access in Task/Repository                                                               |
| Passing Request into Task                                              | Pass scalar/value/data array to Task                                                             |
| Making Task call many Tasks                                            | Use SubAction for sub-use-case orchestration                                                     |
| Hiding multi-write transaction in reusable Task                        | Use Action/`transactionalRun()` for workflow consistency                                         |
| Copying RequestCriteria examples onto an undefined `$this->repository` | Inject Repository in Task, apply `addRequestCriteria()` before `run()`                           |
| Returning raw numeric IDs                                              | Return `getHashedKey()` and decode inputs in Request                                             |
| Leaving private `authorize()` as `true`                                | Use `$access` and `$this->check(['hasAccess'])` unless intentionally open to authenticated users |
| Missing `max` on strings                                               | Cap create/update strings to database column length                                              |
| Exposing sensitive fields in Transformer or `filter`                   | Keep Transformer public and safe                                                                 |
| Letting list APIs return unbounded results                             | Paginate or enforce safe max `limit`                                                             |
| Dispatching external side effects before transaction commit            | Dispatch after successful state change, queue with after-commit when needed                      |
| Running Pint by habit in this repo                                     | Use repo validators from `AGENTS.md`, especially `php-cs-fixer`                                  |

## Red Flags

Stop and re-check docs/repo patterns if you are about to say:

- "The skill says this, so I can ignore Apiato 11.x docs."
- "This is just a quick endpoint, no Request/Transformer needed."
- "A Task can accept Request because it is convenient."
- "Search/filter can expose every column."
- "The frontend wants everything, so pagination can wait."
- "The listener can perform required writes later."
- "The generated code compiles, so indexes and validation caps can wait."

## Definition of Done

- Wireframe/API contract understood.
- Migration includes constraints and indexes, not just columns.
- Request validates, authorizes, decodes, and caps inputs.
- Action/Task/Repository responsibilities are clean.
- Multi-write workflow transaction is explicit at Action/controller `transactionalRun()` level.
- List APIs paginate, avoid N+1, and use indexed filters.
- Transformer returns safe hashed response.
- Side effects are decoupled with Event/Listener when appropriate, queued after commit if slow/external.
- Tests/validators run or explicit blocker documented.
- No secrets, logs, dumps, cache, or unrelated files included.

## Validation

Run suitable checks before handoff:

```txt
composer validate --strict
vendor/bin/php-cs-fixer fix --config=php_cs.dist.php --dry-run --diff
vendor/bin/psalm --config=psalm.dist.xml
vendor/bin/phpunit
```

For this repo, prefer `AGENTS.md` validators. Scoped checks on changed files are acceptable during iteration, but full checks are preferred before release. Do not run frontend builds unless the change touches frontend/build pipeline.

## References

- Local Apiato 11.x docs:
  - `D:\Hieubkav\Laravel\study\folk-docs-api-ato\versioned_docs\version-11.x\getting-started\software-architectural-patterns.md`
  - `D:\Hieubkav\Laravel\study\folk-docs-api-ato\versioned_docs\version-11.x\getting-started\conventions-and-principles.md`
  - `D:\Hieubkav\Laravel\study\folk-docs-api-ato\versioned_docs\version-11.x\main-components\actions.md`
  - `D:\Hieubkav\Laravel\study\folk-docs-api-ato\versioned_docs\version-11.x\main-components\subactions.mdx`
  - `D:\Hieubkav\Laravel\study\folk-docs-api-ato\versioned_docs\version-11.x\main-components\tasks.md`
  - `D:\Hieubkav\Laravel\study\folk-docs-api-ato\versioned_docs\version-11.x\main-components\requests.md`
  - `D:\Hieubkav\Laravel\study\folk-docs-api-ato\versioned_docs\version-11.x\main-components\controllers.md`
  - `D:\Hieubkav\Laravel\study\folk-docs-api-ato\versioned_docs\version-11.x\main-components\routes.md`
  - `D:\Hieubkav\Laravel\study\folk-docs-api-ato\versioned_docs\version-11.x\main-components\transformers.md`
  - `D:\Hieubkav\Laravel\study\folk-docs-api-ato\versioned_docs\version-11.x\optional-components\repositories.md`
  - `D:\Hieubkav\Laravel\study\folk-docs-api-ato\versioned_docs\version-11.x\optional-components\events.md`
  - `D:\Hieubkav\Laravel\study\folk-docs-api-ato\versioned_docs\version-11.x\optional-components\tests.md`
  - `D:\Hieubkav\Laravel\study\folk-docs-api-ato\versioned_docs\version-11.x\core-features\query-parameters.md`
  - `D:\Hieubkav\Laravel\study\folk-docs-api-ato\versioned_docs\version-11.x\core-features\code-generator.md`
  - `D:\Hieubkav\Laravel\study\folk-docs-api-ato\versioned_docs\version-11.x\core-features\hash-id.md`
- Official docs:
  - https://apiato.io/docs/11.x/core-features/query-parameters/
  - https://apiato.io/docs/11.x/main-components/requests/
  - https://apiato.io/docs/11.x/optional-components/repositories/
  - https://apiato.io/docs/11.x/core-features/code-generator/
  - https://apiato.io/docs/11.x/core-features/hash-id/
- Detailed local notes: [references/apiato-11-notes.md](references/apiato-11-notes.md)
