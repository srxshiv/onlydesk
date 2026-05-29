# Architecture

## One-paragraph summary

`onlydesk` is a NestJS + Next.js monorepo where users install **tools** onto a virtual desk. Each tool is a plugin (manifest + handlers + UI components) that can read from a **context store** (typed event log of the user's life) and optionally call **MCP servers**. AI orchestration runs through **Google ADK (TypeScript)** with **Gemini 2.5 Pro** by default.

## The two load-bearing abstractions

1. **`ToolManifest`** (`packages/tools-sdk`) — every tool declares one. The API registry validates manifests at registration time, the install/uninstall flow records per-user installations, and the web app dispatches to a tool's workspace component by reading its manifest. New tools touch zero core code.
2. **Context store** (`apps/api/src/context`) — a typed event log per scope (`work_log`, `job_target`, `skills`, `projects`, `education`, `goals`, `social_voice`, `health_log`). Each scope has its own table. Tools declare the scopes they read, and the runtime enforces it.

## Request flow — invoking a tool action

```
Browser  ──fetch──>  Next.js (client)
                          │
                          │  api-client.tools.invoke(toolId, actionId, input)
                          ▼
                     Nest /api/tools/:toolId/actions/:actionId
                          │
                          ├── ToolsService.invoke()
                          │   ├── ToolRegistry.getDefinition(toolId)
                          │   ├── verify InstalledTool row
                          │   ├── insert ToolActionInvocation row (status=pending)
                          │   ├── if action.execution === 'queued'
                          │   │     queue BullMQ job ──> ToolActionsProcessor
                          │   └── else run inline handler
                          │         handler({ ctx, runAgent, getMcpToolset, ... })
                          │             ├── ctx.read(scope)    -> ContextService (scope-checked)
                          │             ├── getMcpToolset()    -> McpService -> @google/adk MCPToolset
                          │             └── runAgent({ model, instruction, prompt, tools })
                          │                                    -> AgentRunnerService -> ADK LlmAgent
                          ▼
                     ToolActionInvocation (status=succeeded|failed, output|error)
                          │
Browser  <──poll/SSE────┘
```

## Modules

| Module | Responsibility |
| --- | --- |
| `auth` | sign-up / sign-in / OAuth, JWT, refresh tokens, httpOnly cookies. |
| `users` | user lookup + provider linking. |
| `context` | the typed event log; per-scope CRUD + summaries. |
| `tools` | registry + install/uninstall + invoke + invocation history. |
| `mcp` | thin wrapper around `@google/adk`'s `MCPToolset` per transport. |
| `agents` | `AgentRunnerService` — single place that builds and runs an ADK `LlmAgent`. |
| `jobs` | BullMQ worker that executes `queued` actions out-of-process. |

## Why this split

- **`shared-types` is the source of truth.** API entities and api-client functions both depend on it. No duplicated type definitions; nothing drifts.
- **Tools cannot import from core modules.** They only depend on `tools-sdk` + `shared-types`. The API hosts them; they don't reach back in. This keeps tools portable enough for a future third-party marketplace.
- **MCP is centralized.** The `McpService` is the only place that knows how to translate a `ToolMcpConfig` into an ADK `MCPToolset`. Switching transports or adding auth strategies is one file.
- **Agent runs are centralized.** All Gemini calls go through `AgentRunnerService`. One place to add tracing, budgeting, and per-tool model overrides.
- **Queued vs inline.** Each action declares its execution mode. Short prompts run inline; long-running ADK + MCP chains queue through BullMQ so the HTTP request returns immediately and the desk can poll/stream the invocation.

## Authorization

- JWT guard is global. Endpoints opt out with `@Public()`.
- CASL `AbilityFactory` produces a per-user `AppAbility`; controllers check it for cross-user access (e.g., reading another user's invocation).
- Inside a tool handler, the `ctx` client refuses any scope not declared in the tool's manifest. Defense in depth.

## What lives where (cheat sheet)

- New domain type? → `packages/shared-types`
- New endpoint? → `apps/api` + add to `packages/api-client`
- New tool? → `tools/<your-tool>`, register in `apps/api/src/tools/tools.module.ts`
- New context scope? → `packages/shared-types/src/context.ts` + new entity + new migration + map in `ContextService`

## Production readiness gaps to close before launch

- Real OAuth provider strategies (Google/GitHub) — stubs only.
- Per-tool secret storage (Overleaf token, etc.) — encrypted column on `installed_tools.config`.
- Rate limiting on `/tools/.../actions/...` per user.
- Observability: OpenTelemetry traces around `AgentRunnerService.run()` and `McpService.buildToolset()`.
- ADK error taxonomy → sanitized user-facing messages.
