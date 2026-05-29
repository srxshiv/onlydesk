import type { ApiResult, ContextEntryByScope, ContextScopeId, ContextSummary } from '@onlydesk/shared-types'
import type { createClient } from '../client.js'

export const contextEndpoints = (client: ReturnType<typeof createClient>) => ({
  list: <S extends ContextScopeId>(scope: S, opts?: { limit?: number; since?: string }): Promise<ApiResult<ContextEntryByScope[S][]>> =>
    client.request(async (w) => w.url(`/context/${scope}`).query(opts ?? {}).get().json<ContextEntryByScope[S][]>()),

  create: <S extends ContextScopeId>(scope: S, entry: Partial<ContextEntryByScope[S]>): Promise<ApiResult<ContextEntryByScope[S]>> =>
    client.request(async (w) => w.url(`/context/${scope}`).post(entry).json<ContextEntryByScope[S]>()),

  remove: (scope: ContextScopeId, id: string): Promise<ApiResult<{ ok: true }>> =>
    client.request(async (w) => w.url(`/context/${scope}/${id}`).delete().json<{ ok: true }>()),

  summary: (scope: ContextScopeId): Promise<ApiResult<ContextSummary>> => client.request(async (w) => w.url(`/context/${scope}/summary`).get().json<ContextSummary>()),
})
