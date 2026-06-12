'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ContextScopeId } from '@onlydesk/shared-types'
import type { CreateSchemaInput } from '@onlydesk/api-client'
import { useToolApi } from './host'
import { unwrap } from './errors'

/**
 * The single data-hook layer shared by the desk harness and every tool UI.
 * Query keys are defined once here, so a tool mutating todos invalidates the
 * same caches the drawer reads — one QueryClient, one source of truth.
 */

const KEYS = {
  schemas: ['context', 'schemas'] as const,
  records: (scope: string) => ['context', 'records', scope] as const,
}

/* ===== Tools / registry ===== */

export const useAvailableTools = () => {
  const api = useToolApi()
  return useQuery({ queryKey: ['tools', 'available'], queryFn: () => unwrap(api.tools.listAvailable()) })
}

export const useInstalledTools = () => {
  const api = useToolApi()
  return useQuery({ queryKey: ['tools', 'installed'], queryFn: () => unwrap(api.tools.listInstalled()) })
}

export const useInstallTool = () => {
  const api = useToolApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (toolId: string) => unwrap(api.tools.install(toolId)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tools', 'installed'] }),
  })
}

export const useUninstallTool = () => {
  const api = useToolApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (toolId: string) => unwrap(api.tools.uninstall(toolId)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tools', 'installed'] }),
  })
}

/** Replace the context scopes a tool may read (built-in ids or custom-store keys). */
export const useUpdateGrants = () => {
  const api = useToolApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ toolId, grants }: { toolId: string; grants: string[] }) => unwrap(api.tools.updateGrants(toolId, grants)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tools', 'installed'] }),
  })
}

/** Invoke a tool action. Queued actions return a pending invocation to poll. */
export const useInvokeAction = () => {
  const api = useToolApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ toolId, actionId, input }: { toolId: string; actionId: string; input: Record<string, unknown> }) => unwrap(api.tools.invoke(toolId, actionId, input)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['context', 'records'] }),
  })
}

/** Poll one invocation while it's pending/running — renders live progress. */
export const useInvocation = (id: string | null) => {
  const api = useToolApi()
  return useQuery({
    queryKey: ['tools', 'invocation', id],
    enabled: Boolean(id),
    queryFn: () => unwrap(api.tools.getInvocation(id!)),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'pending' || status === 'running' ? 1200 : false
    },
  })
}

/* ===== Custom scope schemas ===== */

export const useContextSchemas = () => {
  const api = useToolApi()
  return useQuery({ queryKey: KEYS.schemas, queryFn: () => unwrap(api.context.listSchemas()) })
}

export const useCreateSchema = () => {
  const api = useToolApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSchemaInput) => unwrap(api.context.createSchema(input)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.schemas }),
  })
}

export const useDeleteSchema = () => {
  const api = useToolApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => unwrap(api.context.deleteSchema(key)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['context'] }),
  })
}

/* ===== Records — one set of hooks for built-in and custom scopes ===== */

/** Rows come back flat for built-in scopes and `{ data }`-nested for custom. */
export type AnyRecordRow = Record<string, unknown> & { id: string; createdAt?: string }

export const useScopeRecords = (scope: string, enabled = true) => {
  const api = useToolApi()
  return useQuery({
    queryKey: KEYS.records(scope),
    enabled,
    queryFn: () => unwrap(api.context.listRecords(scope, { limit: 100 })) as Promise<AnyRecordRow[]>,
  })
}

export const useCreateRecord = (scope: string) => {
  const api = useToolApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      // Built-in scopes post to their typed tables; custom scopes to JSONB records.
      const result = (isBuiltin(scope) ? api.context.create(scope as ContextScopeId, data as never) : api.context.createRecord(scope, data)) as Promise<
        import('@onlydesk/shared-types').ApiResult<unknown>
      >
      return unwrap(result)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.records(scope) }),
  })
}

export const useUpdateRecord = (scope: string) => {
  const api = useToolApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) => unwrap(api.context.update(scope, id, patch)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.records(scope) }),
  })
}

export const useDeleteRecord = (scope: string) => {
  const api = useToolApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => unwrap(api.context.removeRecord(scope, id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.records(scope) }),
  })
}

const BUILTIN: readonly string[] = ['work_log', 'job_target', 'skills', 'projects', 'education', 'goals', 'social_voice', 'health_log', 'todos']
export const isBuiltin = (scope: string): boolean => BUILTIN.includes(scope)
