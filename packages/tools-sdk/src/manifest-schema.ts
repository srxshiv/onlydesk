import { z } from 'zod'

/** Zod mirror of ToolManifest for runtime validation when a tool is loaded. */
export const ContextScopeIdSchema = z.enum(['work_log', 'job_target', 'skills', 'projects', 'education', 'goals', 'social_voice', 'health_log'])

export const ToolMcpConfigSchema = z.object({
  transport: z.enum(['stdio', 'sse', 'http']),
  serverUrl: z.string().url().optional(),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  auth: z.enum(['oauth', 'apikey', 'none']),
  requiredScopes: z.array(z.string()).optional(),
})

export const ToolActionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  input: z.object({
    type: z.literal('object'),
    properties: z.record(z.unknown()),
    required: z.array(z.string()).optional(),
  }),
  execution: z.enum(['inline', 'queued']),
  model: z.string().optional(),
})

export const ToolManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  category: z.enum(['professional', 'casual', 'health', 'creative', 'planning']),
  icon: z.object({ deskObject: z.string(), color: z.string() }),
  model: z.string().optional(),
  mcp: ToolMcpConfigSchema.optional(),
  contextScopes: z.array(ContextScopeIdSchema),
  actions: z.array(ToolActionSchema),
  permissions: z.object({
    read: z.array(ContextScopeIdSchema),
    write: z.array(ContextScopeIdSchema),
  }),
  surfaces: z.object({
    deskIcon: z.string(),
    workspace: z.string(),
  }),
})
