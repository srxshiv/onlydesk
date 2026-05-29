# MCP Integration

`onlydesk` uses **Google ADK (TypeScript)** to talk to MCP servers. ADK ships `MCPToolset`, which converts an MCP server's tools into ADK tools the agent can call. We wrap that in `McpService` so per-user concerns (auth, env) live in one place.

## Where it lives

- **`apps/api/src/mcp/mcp.service.ts`** — translates a `ToolMcpConfig` into an `MCPToolset`.
- **`apps/api/src/agents/agent-runner.service.ts`** — builds the `LlmAgent` with the toolset attached.
- **Tool handlers** — call `getMcpToolset()` to materialize the configured server, then pass it to `runAgent({ tools: [toolset] })`.

## Declaring an MCP server on a tool

In your tool's `ToolManifest`:

```ts
mcp: {
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@overleaf/mcp-server'],
  auth: 'oauth',
  requiredScopes: ['projects:read', 'projects:write'],
}
```

Supported transports:

| Transport | When |
| --- | --- |
| `stdio` | Local MCP servers spawned as child processes. Cleanest for first-party tools. |
| `sse` | Hosted MCP servers exposing SSE. |
| `http` | Hosted MCP servers exposing streamable HTTP. |

## Per-user auth (OAuth)

Phase 1 contract:

1. User installs a tool whose MCP requires OAuth.
2. Web app sends them through a provider-specific OAuth flow (handled outside ADK — Phase 2 wiring).
3. The token lands in `installed_tools.config` (encrypted at rest).
4. At invocation time, `ToolsService` reads the config, hands the bearer/access token to `McpService.buildToolset()` as `perUserEnv`, which injects it into the MCP server's env or headers.

## Calling the toolset from a handler

```ts
const toolset = await ctx.getMcpToolset()
const agent = await ctx.runAgent({
  instruction: '...',
  prompt: '...',
  tools: toolset ? [toolset] : undefined,
})
```

That's all the handler needs to know. The agent will call MCP tools autonomously; ADK reports results back through the agent's text or tool-result stream.

## Error handling

`McpService.buildToolset` throws on misconfiguration. `AgentRunnerService.run` lets ADK errors propagate; `ToolsService.invoke` catches them and writes `status='failed'` + a sanitized error to the invocation row. The user never sees a raw MCP stack trace.

## Adding a transport

If ADK ships a new connection type, extend the switch in `McpService.buildToolset`. The manifest schema's `transport` enum is the only public surface.
