'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { ApiClient } from '@onlydesk/api-client'

/**
 * The host bridge. Tool UI packages never construct their own API client —
 * the harness (apps/web) provides its configured client through this context,
 * and the kit's data hooks consume it. Tools stay env-free and isolated.
 */
const ToolHostContext = createContext<ApiClient | null>(null)

export const ToolHostProvider = ({ api, children }: { api: ApiClient; children: ReactNode }) => (
  <ToolHostContext.Provider value={api}>{children}</ToolHostContext.Provider>
)

export const useToolApi = (): ApiClient => {
  const api = useContext(ToolHostContext)
  if (!api) throw new Error('useToolApi must be used inside <ToolHostProvider> (the desk harness provides it)')
  return api
}
