# onlydesk — Engineer Onboarding

> You've never seen this repo. Read this top to bottom (~10 min) and you'll know what exists, where it lives, how deep each part goes, and where it's heading.

## The idea

**onlydesk is a personal productivity desk.** The user owns a warm, wooden, lamp-lit virtual desk. They install **AI tools** (widgets) onto it. The desk has a **Context Store** — a structured memory of the user's life (work history, skills, goals, health, plus any custom data structure they invent). The user explicitly **wires** context stores into tools; tools then use Gemini 2.5 Pro plus that context to do real work (tailor a resume to a JD, parse "gym at 7pm every Monday" into habits).

Three load-bearing ideas:
1. **Context is the moat** — tools share one user-owned memory instead of each hoarding its own.
2. **Consent is explicit** — tools read *only* what the user plugged into them (grants), enforced server-side.
3. **Tools are plugins** — manifest + handlers + UI in an isolated package; the web app is a dumb harness.

## Monorepo map

```
apps/
  api/          NestJS 11 + TypeORM + Postgres + Redis/BullMQ — the entire backend
  web/          Next.js 15 App Router — the desk harness (no tool-specific code)
packages/
  shared-types/ Zero-dep TS contracts. THE source of truth — start reading here.
  api-client/   wretch-based typed HTTP client (ApiResult<T> everywhere)
  tools-sdk/    The tool contract: defineTool(), ActionContext, manifest zod schema
  tool-ui-kit/  Shared UI substrate: glass primitives, data hooks, host context, contracts
  config/       Shared tsconfigs
tools/
  resume-editor/  Flagship tool 1: JD → tailored LaTeX + diff (Gemini, queued)
  smart-todo/     Flagship tool 2: NL → structured tasks, habit matrix (Gemini, inline)
docs/           Segregated: manual/ api/ architecture/ guides/ + ROADMAP.md
```

## How a tool works (the core loop)

1. Package exports `defineTool({ manifest, handlers })` (node side) + `./ui` exporting exactly `ToolDeskIcon` and `ToolWorkspace` (React side).
2. API registers it in-process and mirrors the manifest to the `tool_manifests` table.
3. User installs it → `installed_tools` row; manifest's `contextScopes` seed `context_grants` (the user can rewire these in the drawer's **Tool access** patch bay — runtime reads gate **strictly on grants**, in both execution paths).
4. User invokes an action → `tool_action_invocations` row. `inline` actions run in-request; `queued` run on BullMQ (retries/backoff/timeout/DLQ). Handlers `stream()` progress beats into a jsonb log the UI polls at 1.2s.
5. Handler reads granted context via `ctx.readAny(scope)`, calls `runAgent({ instruction, prompt, responseSchema })` → **Gemini 2.5 Pro via Google ADK with schema-enforced JSON output**. No key → invocation fails with an explicit, user-visible error (no mock engine).
6. Web renders the tool's surfaces via `lib/tool-registry.tsx` (`next/dynamic` lazy imports) — the only file in web that knows tool ids.

## What's implemented, honestly

| Area | State |
| --- | --- |
| Auth (email/password, JWT cookies, refresh) | ✅ solid · OAuth = stubs |
| Context store: 9 built-in scopes, CRUD+PATCH, CASL | ✅ solid |
| Custom JSONB stores (user-defined schemas, validated writes) | ✅ solid |
| Tool↔scope grants + patch-bay UI | ✅ solid, smoke-tested |
| AES-256-GCM at-rest encryption (`installed_tools.config`) | ✅ solid · no key rotation |
| BullMQ pipeline (retry/backoff/timeout/DLQ/progress log) | ✅ solid |
| Gemini via ADK + structured output | ✅ wired & typed · **never run with a live key yet** — set `GOOGLE_API_KEY` |
| Desk UI: spaces, wood/lamp theming via CSS vars, grid+freeform drag, widget expand morph | ✅ solid |
| Tool UIs (resume bench, habit matrix, omni-bar, heatmap) | ✅ in tool packages, lazy-loaded |
| Layout cloud sync (`PATCH /tools/layouts`, debounced) | ✅ smoke-tested |
| Seeders (AI-fullstack-dev context, 6-day gym split history) | ✅ `pnpm db:seed`, idempotent, `SEED_USER_EMAIL` |
| Overleaf MCP push, real PDF compile | ❌ adapter exists, never connected |
| Rate limiting, OpenTelemetry, automated tests, eslint binary | ❌ none |
| Third-party tool marketplace / sandboxing | ❌ Phase 3 |

## Docs — what to read for what

| You want… | Read |
| --- | --- |
| To run it locally, env vars, troubleshooting | `docs/guides/SETUP.md` |
| Day-to-day workflows (migrations, queues, where things go) | `docs/guides/DEVELOPMENT.md` |
| To ship it | `docs/guides/DEPLOYMENT.md` |
| To build a new tool | `docs/guides/TOOL-SDK.md` + copy `tools/smart-todo` |
| Endpoint reference + error contract | `docs/api/REST-API.md` |
| System design + authorization model | `docs/architecture/ARCHITECTURE.md` |
| Context store internals (built-in + JSONB custom) | `docs/architecture/CONTEXT-STORE.md` |
| What the user experiences | `docs/manual/USER-MANUAL.md` |
| What ships when | `docs/ROADMAP.md` |

## Quick start

```bash
pnpm install && docker compose up -d        # (local Postgres on :5432? see SETUP §2b)
cp apps/api/.env.example apps/api/.env      # set CONFIG_ENCRYPTION_KEY (openssl rand -base64 32)
                                            # set GOOGLE_API_KEY for AI actions
cp apps/web/.env.example apps/web/.env.local
pnpm db:migrate && pnpm db:seed && pnpm dev # api :4000, web :3000
```

## Engineering conventions

- `shared-types` first: every contract starts there; API entities and client both derive from it.
- Schema is migration-owned (`synchronize` hard-off). Hand-review generated SQL.
- All errors flow through one typed contract (`code/message/details.violations`) — HTTP and worker alike.
- All colors flow through CSS variables (`--ink/--line/--pane/--accent/--wood-*`) — Focus Spaces re-tint the entire app; never hardcode a palette color.
- Tools never import from `apps/web`; they depend on `tool-ui-kit` + `tools-sdk` + `shared-types` only.
- `turbo typecheck` must stay green; it's the only automated gate (no tests yet — known debt).

## The road ahead (ROADMAP.md, condensed)

- **Now**: paste a real `GOOGLE_API_KEY` and battle-test the Gemini paths; Overleaf MCP push.
- **Phase 3**: third-party tools — DB-driven component loading (replace the registry map), sandboxed handlers, marketplace UI with permission disclosure.
- **Phase 4**: tools that write context automatically (GitHub/Linear/Slack work-log ingest).
- **Phase 5**: the cross-tool daily agent — reads across scopes, proposes desk-level actions. The reason the context store is shaped the way it is.
