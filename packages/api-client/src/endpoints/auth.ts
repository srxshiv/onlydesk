import type { AuthTokens, SessionUser, SignInInput, SignUpInput, ApiResult } from '@onlydesk/shared-types'
import type { createClient } from '../client.js'

export const authEndpoints = (client: ReturnType<typeof createClient>) => ({
  signUp: (input: SignUpInput): Promise<ApiResult<{ user: SessionUser; tokens: AuthTokens }>> =>
    client.request(async (w) => w.url('/auth/sign-up').post(input).json<{ user: SessionUser; tokens: AuthTokens }>()),

  signIn: (input: SignInInput): Promise<ApiResult<{ user: SessionUser; tokens: AuthTokens }>> =>
    client.request(async (w) => w.url('/auth/sign-in').post(input).json<{ user: SessionUser; tokens: AuthTokens }>()),

  signOut: (): Promise<ApiResult<{ ok: true }>> => client.request(async (w) => w.url('/auth/sign-out').post().json<{ ok: true }>()),

  me: (): Promise<ApiResult<SessionUser>> => client.request(async (w) => w.url('/auth/me').get().json<SessionUser>()),

  refresh: (): Promise<ApiResult<AuthTokens>> => client.request(async (w) => w.url('/auth/refresh').post().json<AuthTokens>()),
})
