# Development Guide

Day-to-day workflows for working on the onlydesk monorepo.

> **First boot?** Follow the [Setup Guide](SETUP.md) — prerequisites, infrastructure options, env files, full variable reference, and boot troubleshooting. Shipping? See the [Deployment Guide](DEPLOYMENT.md).

## Database & migrations

Schema is owned **exclusively by migrations** — `synchronize` is hard-off everywhere.

```bash
pnpm db:migrate                                            # run pending
pnpm --filter @onlydesk/api migration:revert               # roll back one
pnpm --filter @onlydesk/api migration:generate src/database/migrations/MyChange   # diff entities → migration
pnpm --filter @onlydesk/api migration:create src/database/migrations/MyChange     # empty skeleton
```

Always review generated SQL before committing. `pnpm db:seed` is safe to re-run (manifest upserts by primary key).

## Background jobs (BullMQ)

- Queue `tool-actions` executes `queued` tool actions; failures retry with exponential backoff, then land on `tool-actions-dlq` with a compact error record, and the invocation row is marked `failed`.
- The worker runs inside the API process (`JobsModule`) — no separate process to start in dev.
- Inspect queues quickly: `docker exec -it onlydesk-redis redis-cli` → `KEYS bull:*`.

## Everyday commands

```bash
pnpm dev / dev:api / dev:web
pnpm typecheck        # all packages via turbo
pnpm build
pnpm test
pnpm format
```

Workspace packages (`shared-types`, `tools-sdk`, `api-client`) resolve via their `dist` — rebuild them (`pnpm --filter <pkg> build`) after changing them, or run `pnpm build` once and let turbo order it.

## Where things go

| Change | Touch |
| --- | --- |
| New domain type | `packages/shared-types` (source of truth) |
| New endpoint | `apps/api` module + `packages/api-client` endpoint fn |
| New tool | `tools/<name>` + register in `apps/api/src/tools/tools.module.ts` — see [TOOL-SDK](TOOL-SDK.md) |
| New built-in context scope | shared-types union + entity + migration + `ContextService` map + tools-sdk schema enum |
| User-defined scope | none — runtime feature via `/context/schemas` |
| Frontend desk UI | `apps/web/src/components` (`desk/`, `dock/`, `drawer/`, `overlays/`, `ui/`) |

## Conventions

- Strict TS everywhere; no `any` in committed code.
- API errors must flow through the shared error contract (`toApiError`) — never hand-roll error JSON.
- Frontend server state lives in TanStack Query; desk layout state in the zustand store (`apps/web/src/lib/desk-store.ts`); never duplicate one into the other.
