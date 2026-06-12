# Deployment Guide — running onlydesk in production

What changes between `pnpm dev` and a real deployment, and the checklist to get there safely.

## Topology

```
                ┌────────────┐        ┌──────────────┐
  users ──TLS──▶│ web (Next) │──HTTPS▶│  api (Nest)  │──▶ Postgres 16
                │   :3000    │        │    :4000     │──▶ Redis 7 (BullMQ)
                └────────────┘        │ + worker     │
                                      └──────────────┘
```

- The **BullMQ worker runs inside the API process** (`JobsModule`) — every API replica is also a worker. Scaling API replicas scales queue throughput; that's fine until you need independent worker scaling (then split `JobsModule` into its own Nest app entrypoint).
- The API is otherwise **stateless** — sessions are JWT cookies; desk layout lives in the browser. Safe to run N replicas behind a load balancer.

## Build artifacts

Both apps ship multi-stage Dockerfiles that build the workspace packages in dependency order:

```bash
docker build -f apps/api/Dockerfile -t onlydesk-api .     # node dist/main.js, EXPOSE 4000
docker build -f apps/web/Dockerfile -t onlydesk-web .     # next start,       EXPOSE 3000
```

Bare-metal alternative: `pnpm build` at the root (turbo orders everything), then `node apps/api/dist/main.js` and `pnpm --filter @onlydesk/web start` under a process manager.

> `NEXT_PUBLIC_API_URL` is **baked into the web bundle at build time** (it's a `NEXT_PUBLIC_` var). Build the web image with the real public API URL available, or rebuild per environment.

## Production environment

Everything from the [setup guide's table](SETUP.md#3-environment-files), with these hardened values:

| Variable | Production value |
| --- | --- |
| `NODE_ENV` | `production` — switches cookies to `Secure`, quiets SQL logging |
| `WEB_ORIGIN` | the exact public web origin, e.g. `https://app.onlydesk.example` (CORS allowlist) |
| `COOKIE_DOMAIN` | your apex or app domain — must cover both web and API hosts if they differ |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | long random strings from a secret manager — never the `.env.example` values |
| `CONFIG_ENCRYPTION_KEY` | from a secret manager. **Losing it bricks every stored per-tool secret** (they cannot be decrypted); there is no key-rotation tooling yet, so treat it as precious |
| `DATABASE_URL` | managed Postgres, TLS, least-privilege role |
| `REDIS_URL` | managed Redis **with persistence (AOF)** — queued jobs and the DLQ live here |
| `JOB_*` | tune for your workload; raise `JOB_TIMEOUT_MS` if agent+MCP chains run long |

Serve both apps behind a TLS-terminating reverse proxy. Cookies are `SameSite=Lax`, so keep web and API on the same registrable domain (e.g. `app.example.com` + `api.example.com` with `COOKIE_DOMAIN=example.com`).

## Release procedure

```bash
# 1. Migrate — explicit, never on boot (migrationsRun is false by design)
pnpm --filter @onlydesk/api migration:run        # run from a job/one-off container against prod DATABASE_URL

# 2. Seed/sync manifests (idempotent) — also happens automatically on API boot
pnpm db:seed

# 3. Roll out new images (api first, then web)
```

Rollback: `migration:revert` steps back one migration; revert images alongside. Migrations are hand-reviewed SQL — keep them backward-compatible with the previous app version so old replicas can run during the roll.

## Operations

- **Health**: any unauthenticated route returns the typed 401 envelope quickly — `GET /api/tools/available` works as a liveness probe (expect HTTP 401, body `{"code":"UNAUTHENTICATED"}`).
- **Dead letters**: permanently failed tool actions land on the `tool-actions-dlq` Redis queue with a compact `{code, message, jobId, attemptsMade}` record, and the invocation row is marked `failed`. Watch that queue's depth; replay = re-`add` to `tool-actions` with the original `invocationId`.
- **Logs**: server faults log with request context via the global exception filter; queue failures log with attempt counts via the worker filter. Clients only ever see sanitized typed errors.
- **Backups**: Postgres is the system of record (users, context, invocations, manifests, encrypted tool configs). Redis holds only in-flight/dead jobs.

## Pre-launch gaps (known, deliberate)

Tracked in [ARCHITECTURE.md](../architecture/ARCHITECTURE.md):

- OAuth providers (Google/GitHub) are stubs — email/password only today.
- No per-user rate limiting on action invocation yet.
- No OpenTelemetry tracing around agent runs / MCP toolsets yet.
- No `CONFIG_ENCRYPTION_KEY` rotation tooling (single static key).
