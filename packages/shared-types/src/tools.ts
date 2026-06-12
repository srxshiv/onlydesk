import type { ContextScopeId } from './context.js'

/** ===== ToolManifest — the central contract every tool implements. ===== */

export type ToolCategory = 'professional' | 'casual' | 'health' | 'creative' | 'planning'

export type ToolMcpAuth = 'oauth' | 'apikey' | 'none'

export type ToolMcpConfig = {
  /** ADK MCPToolset transport. */
  transport: 'stdio' | 'sse' | 'http'
  /** For stdio: command + args. For sse/http: URL. */
  serverUrl?: string
  command?: string
  args?: string[]
  env?: Record<string, string>
  auth: ToolMcpAuth
  requiredScopes?: string[]
}

export type ToolActionInputSchema = {
  /** JSON Schema (subset) describing the action's input. Validated at boundary. */
  type: 'object'
  properties: Record<string, unknown>
  required?: string[]
}

export type ToolAction = {
  id: string
  name: string
  description: string
  input: ToolActionInputSchema
  /** Long-running actions run on BullMQ; quick ones run inline. */
  execution: 'inline' | 'queued'
  /** Optional model override per action. Defaults to manifest.model or 'gemini-2.5-pro'. */
  model?: string
}

export type ToolPermissions = {
  /** Context scopes this tool may read. */
  read: ContextScopeId[]
  /** Context scopes this tool may write back to. */
  write: ContextScopeId[]
}

export type ToolIcon = {
  /** Identifier for the desk-object visual (e.g. 'notebook', 'lamp', 'frame'). */
  deskObject: string
  /** Tailwind-compatible accent color. */
  color: string
}

export type ToolManifest = {
  id: string
  name: string
  description: string
  version: string
  category: ToolCategory
  icon: ToolIcon
  /** Default LLM for all actions on this tool. */
  model?: string
  /** Optional MCP server backing this tool. */
  mcp?: ToolMcpConfig
  /** Context scopes this tool reads from at runtime. Must be a subset of permissions.read. */
  contextScopes: ContextScopeId[]
  actions: ToolAction[]
  permissions: ToolPermissions
  surfaces: {
    /** Module path (resolved by web) for the desk-object component. */
    deskIcon: string
    /** Module path for the workspace component. */
    workspace: string
  }
}

/** Persisted desk placement of one tool's widget — synced across devices. */
export type ToolLayout = {
  /** Focus Space id the widget lives on. */
  space: string
  size: 'sm' | 'md' | 'lg'
  /** Freeform-mode position, px relative to the canvas. */
  x: number
  y: number
  /** Freeform stacking order. */
  z: number
  /** Grid-mode slot index within the space. */
  order: number
}

/** Per-user installation row. */
export type InstalledTool = {
  id: string
  userId: string
  toolId: string
  installedAt: string
  config: Record<string, unknown>
  /**
   * Scope keys (built-in ids or the user's custom-store keys) this tool may
   * read. Seeded from the manifest's contextScopes at install; owned and
   * edited by the user afterward. The runtime gates reads strictly on this.
   */
  contextGrants: string[]
  /** Desk placement, null until the user first arranges the widget. */
  layout: ToolLayout | null
  enabled: boolean
}

/** One progress beat emitted by a running handler via `stream()`. */
export type InvocationProgress = { at: string; message: string }

export type ToolActionInvocation = {
  id: string
  userId: string
  toolId: string
  actionId: string
  status: 'pending' | 'running' | 'succeeded' | 'failed'
  input: Record<string, unknown>
  output: Record<string, unknown> | null
  error: string | null
  /** Structured progress log — the UI polls and renders this as a live timeline. */
  progress: InvocationProgress[]
  startedAt: string
  finishedAt: string | null
}
