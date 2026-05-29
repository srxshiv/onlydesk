import type { ContextEntryByScope, ContextScopeId, ToolAction, ToolManifest } from '@onlydesk/shared-types'

/**
 * Runtime-side context client a tool action handler receives. It is bound to
 * the current user and to ONLY the scopes the tool declared. The API enforces
 * scope membership at the controller layer; the type system enforces it here.
 */
export type ContextClient<Scopes extends ContextScopeId> = {
  read<S extends Scopes>(scope: S, opts?: { limit?: number; since?: string }): Promise<ContextEntryByScope[S][]>
  write<S extends Scopes>(scope: S, entry: Omit<ContextEntryByScope[S], 'id' | 'userId' | 'createdAt'>): Promise<ContextEntryByScope[S]>
  summarize(scope: Scopes): Promise<string>
}

/**
 * What each action handler receives at execution time.
 */
export type ActionContext<Scopes extends ContextScopeId> = {
  userId: string
  input: Record<string, unknown>
  ctx: ContextClient<Scopes>
  /** Tool-level config the user has saved (e.g. Overleaf project id). */
  toolConfig: Record<string, unknown>
  /** Stream a partial result back to the caller. */
  stream: (chunk: { type: 'text' | 'json' | 'progress'; data: unknown }) => void
  /** ADK runner — see packages/tools-sdk/src/agent.ts for the helper. */
  runAgent: (opts: RunAgentOptions) => Promise<RunAgentResult>
  /** Get an authed MCP toolset for this tool's declared mcp config. */
  getMcpToolset: () => Promise<unknown>
}

export type ActionHandler<Scopes extends ContextScopeId> = (ctx: ActionContext<Scopes>) => Promise<unknown>

export type RunAgentOptions = {
  model?: string
  instruction: string
  prompt: string
  tools?: unknown[]
}

export type RunAgentResult = {
  text: string
  raw: unknown
}

/**
 * defineTool() — every tool package exports one of these as default.
 *
 * The manifest is the contract surfaced everywhere (registry, web, install
 * flow). Handlers are the server-side implementation. UI components are
 * referenced by path in the manifest and lazy-loaded by the web app.
 */
export type ToolDefinition<Scopes extends ContextScopeId> = {
  manifest: ToolManifest
  handlers: Record<string, ActionHandler<Scopes>>
}

export const defineTool = <Scopes extends ContextScopeId>(def: ToolDefinition<Scopes>): ToolDefinition<Scopes> => {
  const declared = new Set<ContextScopeId>(def.manifest.permissions.read)
  for (const s of def.manifest.contextScopes) {
    if (!declared.has(s)) {
      throw new Error(`Tool "${def.manifest.id}" declares contextScope "${s}" without read permission.`)
    }
  }
  const actionIds = new Set(def.manifest.actions.map((a: ToolAction) => a.id))
  for (const id of Object.keys(def.handlers)) {
    if (!actionIds.has(id)) {
      throw new Error(`Tool "${def.manifest.id}" exports handler "${id}" without a matching action in the manifest.`)
    }
  }
  for (const id of actionIds) {
    if (!def.handlers[id]) {
      throw new Error(`Tool "${def.manifest.id}" declares action "${id}" but no handler is registered.`)
    }
  }
  return def
}
