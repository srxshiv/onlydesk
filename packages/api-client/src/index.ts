import { createClient, type ClientOptions } from './client.js'
import { authEndpoints } from './endpoints/auth.js'
import { toolEndpoints } from './endpoints/tools.js'
import { contextEndpoints } from './endpoints/context.js'

export const createApiClient = (opts: ClientOptions) => {
  const client = createClient(opts)
  return {
    auth: authEndpoints(client),
    tools: toolEndpoints(client),
    context: contextEndpoints(client),
  }
}

export type ApiClient = ReturnType<typeof createApiClient>

export type { ClientOptions } from './client.js'
export * from '@onlydesk/shared-types'
