import type { ApiResult, InstalledTool, ToolActionInvocation, ToolLayout, ToolManifest } from '@onlydesk/shared-types'
import type { createClient } from '../client.js'

export const toolEndpoints = (client: ReturnType<typeof createClient>) => ({
  listAvailable: (): Promise<ApiResult<ToolManifest[]>> => client.request(async (w) => w.url('/tools/available').get().json<ToolManifest[]>()),

  listInstalled: (): Promise<ApiResult<InstalledTool[]>> => client.request(async (w) => w.url('/tools/installed').get().json<InstalledTool[]>()),

  install: (toolId: string): Promise<ApiResult<InstalledTool>> => client.request(async (w) => w.url(`/tools/${toolId}/install`).post().json<InstalledTool>()),

  uninstall: (toolId: string): Promise<ApiResult<{ ok: true }>> => client.request(async (w) => w.url(`/tools/${toolId}/uninstall`).post().json<{ ok: true }>()),

  /** Replace the set of context scopes this tool may read (built-in ids or custom-store keys). */
  updateGrants: (toolId: string, grants: string[]): Promise<ApiResult<InstalledTool>> =>
    client.request(async (w) => w.url(`/tools/${toolId}/grants`).patch({ grants }).json<InstalledTool>()),

  /** Bulk-save widget placements so the desk layout follows the user across devices. */
  updateLayouts: (layouts: Record<string, ToolLayout>): Promise<ApiResult<InstalledTool[]>> =>
    client.request(async (w) => w.url('/tools/layouts').patch({ layouts }).json<InstalledTool[]>()),

  invoke: (toolId: string, actionId: string, input: Record<string, unknown>): Promise<ApiResult<ToolActionInvocation>> =>
    client.request(async (w) => w.url(`/tools/${toolId}/actions/${actionId}`).post(input).json<ToolActionInvocation>()),

  getInvocation: (invocationId: string): Promise<ApiResult<ToolActionInvocation>> =>
    client.request(async (w) => w.url(`/tools/invocations/${invocationId}`).get().json<ToolActionInvocation>()),
})
