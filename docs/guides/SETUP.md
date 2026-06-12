# Setup Guide — zero to a running desk

Boots the full stack for **development**: Postgres, Redis, the NestJS API on `:4000`, and the Next.js web app on `:3000`. For production, see [DEPLOYMENT.md](DEPLOYMENT.md). For day-to-day workflows after first boot, see [DEVELOPMENT.md](DEVELOPMENT.md).

## 0. Prerequisites

| Requirement | Version | Notes |
| --- | --- | --- |
| Node | **≥ 22.12** (repo pins `24.13.0` in `.nvmrc`) | ≥22.12 is a hard floor — the CommonJS API `require()`s ESM workspace packages, which needs Node's `require(esm)` support |
| pnpm | ≥ 9 | `corepack enable` or `npm i -g pnpm` |
| Docker | any recent | for Postgres + Redis (or bring your own, see 2b) |

## 1. Install

```bash
git clone <repo> onlydesk && cd onlydesk
pnpm install
```

## 2. Infrastructure (pick one)

### 2a. All Docker (default)

```bash
docker compose up -d        # postgres:16 on :5432, redis:7 on :6379
```

### 2b. Hybrid — you already run Postgres locally

A native Postgres on `:5432` will clash with the compose mapping. Use it directly and only run Redis in Docker:

```bash
# create the role + database the .env expects
psql -d postgres -c "CREATE ROLE onlydesk LOGIN PASSWORD 'onlydesk'"
psql -d postgres -c "CREATE DATABASE onlydesk OWNER onlydesk"

docker compose up -d redis   # just redis
```

## 3. Environment files

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Then in `apps/api/.env`, **replace the placeholder encryption key** (it's required and validated at boot — must decode to exactly 32 bytes):

```bash
# macOS/Linux one-liner:
sed -i '' "s|^CONFIG_ENCRYPTION_KEY=.*|CONFIG_ENCRYPTION_KEY=$(openssl rand -base64 32)|" apps/api/.env
```

The defaults for everything else work out of the box for local dev. Full variable reference:

| Variable | Required | Default / notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | `postgresql://onlydesk:onlydesk@localhost:5432/onlydesk` |
| `REDIS_URL` | ✅ | `redis://localhost:6379` |
| `WEB_ORIGIN` | ✅ | `http://localhost:3000` — CORS allowlist |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | ✅ | ≥32 chars each; change for anything shared |
| `CONFIG_ENCRYPTION_KEY` | ✅ | 32 bytes base64/hex — encrypts per-tool secrets at rest |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | – | `15m` / `30d` |
| `COOKIE_DOMAIN` | – | `localhost` |
| `JOB_ATTEMPTS` / `JOB_BACKOFF_MS` / `JOB_TIMEOUT_MS` / `JOB_CONCURRENCY` | – | `3` / `2000` / `120000` / `5` — BullMQ tuning |
| `GOOGLE_API_KEY` | for AI actions | **Tool AI actions (resume tailoring, omni-bar parsing) run Gemini 2.5 Pro and fail with a clear error without it.** Get a key from Google AI Studio. There is no mock engine. |
| `GEMINI_DEFAULT_MODEL` | – | defaults to `gemini-2.5-pro` |
| `GOOGLE_/GITHUB_CLIENT_*` | – | OAuth — stubs only for now |

`apps/web/.env.local` needs exactly one value: `NEXT_PUBLIC_API_URL=http://localhost:4000/api`.

## 4. Database

```bash
pnpm db:migrate     # applies all TypeORM migrations (schema is migration-owned; synchronize is off)
pnpm db:seed        # registers core tool manifests into the DB registry — idempotent, safe to re-run
```

## 5. Run

```bash
pnpm dev            # both servers via turbo, hot-reload
# or individually:
pnpm dev:api        # NestJS on :4000 (BullMQ worker runs in-process)
pnpm dev:web        # Next.js on :3000
```

## 6. Verify it's alive

```bash
curl -s http://localhost:4000/api/tools/available   # → {"code":"UNAUTHENTICATED",...}  = API up, auth guard working
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000   # → 200 = web up
```

Then open **http://localhost:3000** → *Get a desk* → sign up → you're on the desk. Press **⌘K**, install the Resume Editor, open the Context Store from the dock.

## Troubleshooting first boot

| Symptom | Cause → fix |
| --- | --- |
| `Invalid environment variables` on any command | A required var in `apps/api/.env` is missing/malformed — the zod error lists which. Most often `CONFIG_ENCRYPTION_KEY` isn't 32 bytes. |
| `ECONNREFUSED :5432` / `:6379` | Postgres/Redis not running — `docker compose up -d` (or start your local services). |
| Port `5432` already allocated when composing | You have a native Postgres — use path **2b**. |
| API logs `Cannot find module dist/main` | Stale build state: `rm -rf apps/api/dist apps/api/tsconfig.tsbuildinfo` and restart `pnpm dev`. |
| `No matching version found for …` during install | Lockfile/registry drift — re-run `pnpm install`; if a version truly vanished, bump it in the package's `package.json`. |
| Queued tool actions stay `pending` | Redis is down, or the API process (which hosts the worker) isn't running. |
| Sign-in loops back to the form | API not reachable from the browser — check `NEXT_PUBLIC_API_URL` and that `WEB_ORIGIN` matches the web URL (CORS). |
