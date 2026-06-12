import wretch from 'wretch'
import QueryStringAddon from 'wretch/addons/queryString'
import { err, ok, type ApiError, type ApiErrorCode, type ApiResult } from '@onlydesk/shared-types'

/** Base wretch instance with the query-string addon registered (`.query(...)`). */
const makeBase = (baseUrl: string) => wretch(baseUrl).addon(QueryStringAddon).options({ credentials: 'include' })
type BaseClient = ReturnType<typeof makeBase>

export type ClientOptions = {
  baseUrl: string
  /** Returns the current access token for Authorization header, if any. */
  getAccessToken?: () => string | null | Promise<string | null>
  /** Called when the server returns 401 — host app can refresh + retry. */
  onUnauthenticated?: () => void
}

const codeFromStatus = (status: number): ApiErrorCode => {
  if (status === 401) return 'UNAUTHENTICATED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  if (status === 422) return 'VALIDATION_FAILED'
  if (status === 429) return 'RATE_LIMITED'
  if (status >= 500 && status < 600) return 'UPSTREAM_ERROR'
  return 'INTERNAL'
}

export const createClient = (opts: ClientOptions) => {
  const base = makeBase(opts.baseUrl)

  const withAuth = async (): Promise<BaseClient> => {
    if (!opts.getAccessToken) return base
    const token = await opts.getAccessToken()
    return token ? base.auth(`Bearer ${token}`) : base
  }

  const request = async <T>(fn: (w: BaseClient) => Promise<T>): Promise<ApiResult<T>> => {
    try {
      const w = await withAuth()
      const data = await fn(w)
      return ok(data)
    } catch (e: unknown) {
      const status = typeof (e as { status?: number }).status === 'number' ? (e as { status: number }).status : 500
      const code = codeFromStatus(status)
      if (code === 'UNAUTHENTICATED') opts.onUnauthenticated?.()
      const body = (e as { json?: { message?: string; code?: string; details?: Record<string, unknown> } }).json
      const error: ApiError = {
        code,
        message: body?.message ?? 'Request failed',
        details: body?.details,
      }
      return err(error)
    }
  }

  return { request, withAuth }
}
