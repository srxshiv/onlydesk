import { createApiClient } from '@onlydesk/api-client'
import { env } from '@/env'

export const api = createApiClient({
  baseUrl: env.NEXT_PUBLIC_API_URL,
  getAccessToken: () => null,
  onUnauthenticated: () => {
    if (typeof window !== 'undefined') window.location.href = '/auth/sign-in'
  },
})
