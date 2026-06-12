# Context Store

A typed event log per scope. The one thing that makes "AI-enhanced" actually work across tools.

## Why event log, not chat blob

A chat history blob is opaque — tools cannot ask "what did the user ship last week?" without re-parsing prose. An event log has shape:

- typed columns → cheap, indexed queries
- per-scope retention and permissions
- summaries materialized when needed, not inline in every prompt

## Scopes (Phase 1)

| Scope id | Table | What it is |
| --- | --- | --- |
| `work_log` | `ctx_work_log` | What you did. (date, project, summary, tags) |
| `job_target` | `ctx_job_target` | Jobs you're targeting. (company, role, JD) |
| `skills` | `ctx_skill` | Self-declared skills + level + years. |
| `projects` | `ctx_project` | Things you've built. |
| `education` | `ctx_education` | Schools, degrees, dates. |
| `goals` | `ctx_goal` | Active / achieved / abandoned. |
| `social_voice` | `ctx_social_voice` | Past tweets/LinkedIn posts — voice grounding. |
| `health_log` | `ctx_health_log` | Workouts, weight, sleep. |

All have `userId`, `createdAt`. All are isolated per user.

## API surface

```
GET    /api/context/:scope?limit=&since=
POST   /api/context/:scope          { ...entry }
DELETE /api/context/:scope/:id
GET    /api/context/:scope/summary
```

All endpoints require auth. The user can only see their own rows; CASL enforces it at the controller layer.

## Custom scopes (user-defined, JSONB-backed)

Users define their own stores at runtime — no migration, no deploy:

- **`ctx_custom_schemas`** holds the metadata: a per-user `key` (slug), display name, and a `fields` JSONB array of `{ name, label, type, required, options }` (`type` ∈ string · text · number · boolean · date · enum).
- **`ctx_custom_records`** holds the entries: `(user_id, schema_id, data jsonb)`.
- `CustomContextService` validates every record write against the stored field definitions (`context-validation.ts`) and gates everything with the same CASL checks as built-ins.
- Routes are shared: `/context/:scope` dispatches to the typed tables for the 8 built-in ids and to the JSONB store for anything else (404 if undefined). Schema CRUD lives at `/context/schemas` — see the [API reference](../api/REST-API.md).
- Reserved keys: the built-in scope ids, `schemas`, `summary`.

## Adding a new *built-in* scope

For first-class scopes that warrant typed columns and indexes:

1. **`packages/shared-types/src/context.ts`** — add the entry type and to `ContextScopeId` union and `ContextEntryByScope`.
2. **`apps/api/src/context/entities/index.ts`** — add a TypeORM entity.
3. **New migration** — `pnpm --filter @onlydesk/api migration:generate src/database/migrations/Add<Scope>`. Edit to taste.
4. **`apps/api/src/context/context.constants.ts` + `context.service.ts`** — extend `BUILTIN_SCOPES` and `ScopeRepoMap`, inject the repo.
5. **`packages/tools-sdk/src/manifest-schema.ts`** — extend `ContextScopeIdSchema`.

After that, tools can declare it in `contextScopes` and read it via `ctx.read`.

## Summaries

Each `(user, scope)` has at most one `ContextSummary` row. The plan: a scheduled job summarizes recent entries via Gemini, stores the result. Tools read via `ctx.summarize(scope)` instead of re-reading the entire log.

That job is intentionally not built in Phase 1 — first prove a real tool benefits from richer context, then materialize it.

## Privacy posture

- Scopes are isolated. A tool that declares `work_log` cannot read `health_log`.
- The runtime double-checks. `ContextService.assertAllowed()` throws `Forbidden` on undeclared reads even if a tool tries.
- The marketplace (Phase 3) will surface declared scopes prominently to the user on install — same model as iOS permissions.
