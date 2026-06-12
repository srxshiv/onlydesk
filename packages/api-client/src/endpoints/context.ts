import type {
  ApiResult,
  ContextEntryByScope,
  ContextScopeId,
  ContextSummary,
  CustomContextRecord,
  CustomFieldDef,
  CustomScopeDefinition,
} from '@onlydesk/shared-types'
import type { createClient } from '../client.js'

export type CreateSchemaInput = {
  key: string
  name: string
  description?: string
  fields: CustomFieldDef[]
}

export type UpdateSchemaInput = Partial<Omit<CreateSchemaInput, 'key'>>

export const contextEndpoints = (client: ReturnType<typeof createClient>) => ({
  /* ===== Built-in typed scopes ===== */

  list: <S extends ContextScopeId>(scope: S, opts?: { limit?: number; since?: string }): Promise<ApiResult<ContextEntryByScope[S][]>> =>
    client.request(async (w) => w.url(`/context/${scope}`).query(opts ?? {}).get().json<ContextEntryByScope[S][]>()),

  create: <S extends ContextScopeId>(scope: S, entry: Partial<ContextEntryByScope[S]>): Promise<ApiResult<ContextEntryByScope[S]>> =>
    client.request(async (w) => w.url(`/context/${scope}`).post(entry).json<ContextEntryByScope[S]>()),

  remove: (scope: ContextScopeId, id: string): Promise<ApiResult<{ ok: true }>> =>
    client.request(async (w) => w.url(`/context/${scope}/${id}`).delete().json<{ ok: true }>()),

  summary: (scope: ContextScopeId): Promise<ApiResult<ContextSummary>> => client.request(async (w) => w.url(`/context/${scope}/summary`).get().json<ContextSummary>()),

  /* ===== Custom scope schema definitions (/context/schemas) ===== */

  listSchemas: (): Promise<ApiResult<CustomScopeDefinition[]>> => client.request(async (w) => w.url('/context/schemas').get().json<CustomScopeDefinition[]>()),

  getSchema: (key: string): Promise<ApiResult<CustomScopeDefinition>> => client.request(async (w) => w.url(`/context/schemas/${key}`).get().json<CustomScopeDefinition>()),

  createSchema: (input: CreateSchemaInput): Promise<ApiResult<CustomScopeDefinition>> =>
    client.request(async (w) => w.url('/context/schemas').post(input).json<CustomScopeDefinition>()),

  updateSchema: (key: string, input: UpdateSchemaInput): Promise<ApiResult<CustomScopeDefinition>> =>
    client.request(async (w) => w.url(`/context/schemas/${key}`).patch(input).json<CustomScopeDefinition>()),

  deleteSchema: (key: string): Promise<ApiResult<{ ok: true }>> => client.request(async (w) => w.url(`/context/schemas/${key}`).delete().json<{ ok: true }>()),

  /* ===== Records stored against a custom scope (same /context/:scope routes) ===== */

  listRecords: (key: string, opts?: { limit?: number; since?: string }): Promise<ApiResult<CustomContextRecord[]>> =>
    client.request(async (w) => w.url(`/context/${key}`).query(opts ?? {}).get().json<CustomContextRecord[]>()),

  createRecord: (key: string, data: Record<string, unknown>): Promise<ApiResult<CustomContextRecord>> =>
    client.request(async (w) => w.url(`/context/${key}`).post(data).json<CustomContextRecord>()),

  removeRecord: (key: string, id: string): Promise<ApiResult<{ ok: true }>> =>
    client.request(async (w) => w.url(`/context/${key}/${id}`).delete().json<{ ok: true }>()),

  /** Partial update of one entry — works for built-in and custom scopes. */
  update: (scope: string, id: string, patch: Record<string, unknown>): Promise<ApiResult<Record<string, unknown>>> =>
    client.request(async (w) => w.url(`/context/${scope}/${id}`).patch(patch).json<Record<string, unknown>>()),
})
