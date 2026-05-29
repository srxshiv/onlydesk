# onlydesk

> Your personal productivity desk. Install AI-powered tools onto a virtual wooden desk and let them work with the context of your real life.

A Turborepo monorepo: NestJS API + Next.js web + a plugin system (`tools-sdk`) so new tools drop in cleanly. AI agents are powered by **Google ADK (TypeScript)** with **Gemini 2.5 Pro** and integrate MCP servers natively.

## Quick start

```bash
# 1. Install (requires Node 24.13+, pnpm 9+)
pnpm install

# 2. Start Postgres + Redis
docker compose up -d

# 3. Copy env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 4. Run migrations
pnpm db:migrate

# 5. Start everything
pnpm dev
```

Then visit `http://localhost:3000`.

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

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system overview and request flow
- [docs/TOOL-SDK.md](docs/TOOL-SDK.md) — build a new tool in under an hour
- [docs/CONTEXT-STORE.md](docs/CONTEXT-STORE.md) — the typed event log every tool reads from
- [docs/MCP-INTEGRATION.md](docs/MCP-INTEGRATION.md) — wiring MCP servers via ADK
- [docs/ROADMAP.md](docs/ROADMAP.md) — what ships when

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
