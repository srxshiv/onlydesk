# REST API Reference

Base URL: `http://localhost:4000/api` (all routes carry the global `api` prefix).

- **Auth:** httpOnly cookies (`access_token`, `refresh_token`) set by the auth endpoints; `Authorization: Bearer <token>` also works. Every endpoint requires auth unless marked **public**.
- **Bodies:** JSON in, JSON out.
- **Typed client:** `@onlydesk/api-client` wraps every endpoint below and returns `ApiResult<T>` (`{ ok: true, data } | { ok: false, error }`).

## Error contract

Every error — HTTP or background — is normalized to the shape defined in `@onlydesk/shared-types`:

```json
{ "code": "VALIDATION_FAILED", "message": "Record does not match scope schema", "details": { "violations": [{ "field": "age", "message": "must be a finite number" }] } }
```

| Code | HTTP | Meaning |
| --- | --- | --- |
| `UNAUTHENTICATED` | 401 | No/expired credentials |
| `FORBIDDEN` | 403 | Not yours, or tool lacks a declared scope |
| `NOT_FOUND` | 404 | Unknown resource/scope/route |
| `CONFLICT` | 409 | Duplicate (already installed, key taken, reserved name) |
| `VALIDATION_FAILED` | 400/422 | Bad input; `details.violations` lists per-field messages |
| `RATE_LIMITED` | 429 | Slow down |
| `UPSTREAM_ERROR` | 502/503/504 | A dependency failed |
| `INTERNAL` | 500 | Unexpected; details are logged server-side, never leaked |

---

## Auth — `/auth`

| Method & path | Public | Body | Returns |
| --- | --- | --- | --- |
| `POST /auth/sign-up` | ✅ | `{ name, email, password }` | `{ user, tokens }` + sets cookies |
| `POST /auth/sign-in` | ✅ | `{ email, password }` | `{ user, tokens }` + sets cookies |
| `POST /auth/sign-out` | – | – | `{ ok: true }` + clears cookies |
| `POST /auth/refresh` | ✅ | – (reads `refresh_token` cookie) | new tokens + sets cookies |
| `GET /auth/me` | – | – | the current user |

---

## Tools — `/tools`

| Method & path | Body | Returns |
| --- | --- | --- |
| `GET /tools/available` | – | `ToolManifest[]` — the registry |
| `GET /tools/installed` | – | `InstalledTool[]` for the current user |
| `POST /tools/:toolId/install` | – | `InstalledTool` (409 if already installed). `contextGrants` is seeded from the manifest's `contextScopes` |
| `POST /tools/:toolId/uninstall` | – | `{ ok: true }` |
| `PATCH /tools/:toolId/grants` | `{ grants: string[] }` | `InstalledTool` — replaces the scope keys this tool may **read**. Each key must be a built-in scope id or one of the caller's custom-store keys; unknown keys → `VALIDATION_FAILED` with per-key violations |
| `PATCH /tools/layouts` | `{ layouts: { [toolId]: { space, size, x, y, z, order } } }` | `InstalledTool[]` — bulk-saves widget placements (cloud desk-layout sync). Malformed layouts → `VALIDATION_FAILED`; unknown toolIds are ignored |
| `POST /tools/:toolId/actions/:actionId` | action input (validated against the action's JSON schema) | `ToolActionInvocation` |
| `GET /tools/invocations/:id` | – | `ToolActionInvocation` (only your own) |

### Context grants (tool ↔ store binding)

Tool reads are gated **strictly by `contextGrants`** on the installation row — not by the manifest. The manifest's `contextScopes` only seed the defaults at install; afterward the user owns the list (the "Tool access" patch bay in the Context Store drawer drives this endpoint). Handlers read granted built-ins via `ctx.read(scope)` and granted custom stores via `ctx.readAny(key)`; any non-granted scope read throws `FORBIDDEN`.

### Invocation lifecycle

`POST …/actions/:actionId` creates a `ToolActionInvocation` row:

- **inline** actions run before the response returns — `status` is already `succeeded`/`failed`.
- **queued** actions return immediately with `status: "pending"` and execute on the BullMQ worker. Poll `GET /tools/invocations/:id` until `status` is terminal. Failures retry with exponential backoff (default 3 attempts); exhausted jobs are dead-lettered and reported as `failed` with a compact `[CODE] message` in `error`.

```json
{
  "id": "…", "toolId": "resume-editor", "actionId": "tailor-resume",
  "status": "pending | running | succeeded | failed",
  "input": { }, "output": null, "error": null,
  "startedAt": "…", "finishedAt": null
}
```

---

## Context — built-in scopes — `/context/:scope`

`:scope` ∈ `work_log · job_target · skills · projects · education · goals · social_voice · health_log`

| Method & path | Body | Returns |
| --- | --- | --- |
| `GET /context/:scope?limit=&since=` | – | entries, newest first (default limit 100) |
| `POST /context/:scope` | the typed entry (see `ContextEntryByScope` in shared-types) | created entry |
| `DELETE /context/:scope/:id` | – | `{ ok: true }` |
| `GET /context/:scope/summary` | – | `{ scope, summary, generatedAt }` (materialized summaries land later) |

All rows are user-isolated; CASL checks run at the service layer on every call.

## Context — custom scope schemas — `/context/schemas`

User-defined JSONB-backed stores. Creating one requires **no migration**.

| Method & path | Body | Returns |
| --- | --- | --- |
| `GET /context/schemas` | – | `CustomScopeDefinition[]` |
| `POST /context/schemas` | `{ key, name, description?, fields }` | created definition |
| `GET /context/schemas/:key` | – | one definition |
| `PATCH /context/schemas/:key` | `{ name?, description?, fields? }` | updated definition |
| `DELETE /context/schemas/:key` | – | `{ ok: true }` — **deletes the records too** |

**Field definition** (`fields[]`): `{ name, label?, type, required?, options? }` with `type` ∈ `string · text · number · boolean · date · enum` (`enum` requires non-empty `options: string[]`). Field names must match `/^[a-z][a-z0-9_]*$/i`; keys must match `/^[a-z][a-z0-9_-]{1,63}$/` and may not collide with built-in scope ids, `schemas`, or `summary`.

## Context — custom scope records — `/context/:key`

Custom scopes reuse the generic context routes; the `:scope` segment is your schema's `key`.

| Method & path | Body | Returns |
| --- | --- | --- |
| `GET /context/:key?limit=&since=` | – | `CustomContextRecord[]` (payload under `data`) |
| `POST /context/:key` | flat object matching the schema's fields | created record |
| `DELETE /context/:key/:id` | – | `{ ok: true }` |

Every write is validated against the stored field definitions — unknown fields, missing required fields, and type mismatches return `VALIDATION_FAILED` with per-field `violations`.

---

## Conventions

- IDs are UUIDs; timestamps are ISO-8601 strings.
- List endpoints sort `createdAt DESC` and cap `limit` at 500.
- Per-tool secrets (`installed_tools.config`) are AES-256-GCM encrypted at rest; the API never returns other users' rows regardless of credentials.
