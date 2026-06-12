# onlydesk

> Your personal productivity desk. Install AI-powered tools onto a virtual wooden desk and let them work with the context of your real life.

A Turborepo monorepo: NestJS API + Next.js web + a plugin system (`tools-sdk`) so new tools drop in cleanly. AI agents are powered by **Google ADK (TypeScript)** with **Gemini 2.5 Pro** and integrate MCP servers natively.

## Quick start

```bash
# 1. Install (Node ≥22.12 — .nvmrc pins 24.13; pnpm 9+)
pnpm install

# 2. Start Postgres + Redis (have a local Postgres on :5432? see the Setup Guide)
docker compose up -d

# 3. Env files — then generate a real CONFIG_ENCRYPTION_KEY (required at boot)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
sed -i '' "s|^CONFIG_ENCRYPTION_KEY=.*|CONFIG_ENCRYPTION_KEY=$(openssl rand -base64 32)|" apps/api/.env

# 4. Migrate + seed
pnpm db:migrate && pnpm db:seed

# 5. Start everything (api :4000 + web :3000)
pnpm dev
```

Then visit `http://localhost:3000`. Full walkthrough + troubleshooting: [docs/guides/SETUP.md](docs/guides/SETUP.md).

## Layout

| Path | Package | Notes |
| --- | --- | --- |
| `apps/api` | `@onlydesk/api` | NestJS 11 + TypeORM + PostgreSQL. Auth, tool registry, context store, MCP/ADK orchestration. |
| `apps/web` | `@onlydesk/web` | Next.js 15 App Router + React 19 + Tailwind. The desk UI. |
| `packages/shared-types` | `@onlydesk/shared-types` | Zero-dep contracts. Source of truth. |
| `packages/api-client` | `@onlydesk/api-client` | wretch-based typed HTTP client. |
| `packages/tools-sdk` | `@onlydesk/tools-sdk` | The plugin contract every tool implements. |
| `packages/config` | `@onlydesk/config` | Shared tsconfig / eslint / prettier. |
| `tools/resume-editor` | `@onlydesk/tool-resume-editor` | Phase 1 killer tool. |

## Docs

Segregated by audience in [docs/](docs/README.md):

- **Manual** — [docs/manual/USER-MANUAL.md](docs/manual/USER-MANUAL.md) — the full user manual
- **API** — [docs/api/REST-API.md](docs/api/REST-API.md) — endpoint reference + error contract
- **Architecture** — [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) · [CONTEXT-STORE.md](docs/architecture/CONTEXT-STORE.md) · [MCP-INTEGRATION.md](docs/architecture/MCP-INTEGRATION.md)
- **Guides** — [SETUP.md](docs/guides/SETUP.md) (dev, zero→running) · [DEVELOPMENT.md](docs/guides/DEVELOPMENT.md) (day-to-day) · [DEPLOYMENT.md](docs/guides/DEPLOYMENT.md) (production) · [TOOL-SDK.md](docs/guides/TOOL-SDK.md)
- **Roadmap** — [docs/ROADMAP.md](docs/ROADMAP.md) — what ships when

## Commands

```bash
pnpm dev            # api + web together
pnpm dev:api        # just api
pnpm dev:web        # just web
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm format
pnpm db:migrate
pnpm db:seed
```
