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

/** Per-user installation row. */
export type InstalledTool = {
  id: string
  userId: string
  toolId: string
  installedAt: string
  config: Record<string, unknown>
  enabled: boolean
}

export type ToolActionInvocation = {
  id: string
  userId: string
  toolId: string
  actionId: string
  status: 'pending' | 'running' | 'succeeded' | 'failed'
  input: Record<string, unknown>
  output: Record<string, unknown> | null
  error: string | null
  startedAt: string
  finishedAt: string | null
}
