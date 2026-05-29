import type { ApiResult, InstalledTool, ToolActionInvocation, ToolManifest } from '@onlydesk/shared-types'
import type { createClient } from '../client.js'

export const toolEndpoints = (client: ReturnType<typeof createClient>) => ({
  listAvailable: (): Promise<ApiResult<ToolManifest[]>> => client.request(async (w) => w.url('/tools/available').get().json<ToolManifest[]>()),

  listInstalled: (): Promise<ApiResult<InstalledTool[]>> => client.request(async (w) => w.url('/tools/installed').get().json<InstalledTool[]>()),

  install: (toolId: string): Promise<ApiResult<InstalledTool>> => client.request(async (w) => w.url(`/tools/${toolId}/install`).post().json<InstalledTool>()),

  uninstall: (toolId: string): Promise<ApiResult<{ ok: true }>> => client.request(async (w) => w.url(`/tools/${toolId}/uninstall`).post().json<{ ok: true }>()),

  invoke: (toolId: string, actionId: string, input: Record<string, unknown>): Promise<ApiResult<ToolActionInvocation>> =>
    client.request(async (w) => w.url(`/tools/${toolId}/actions/${actionId}`).post(input).json<ToolActionInvocation>()),

  getInvocation: (invocationId: string): Promise<ApiResult<ToolActionInvocation>> =>
    client.request(async (w) => w.url(`/tools/invocations/${invocationId}`).get().json<ToolActionInvocation>()),
})
