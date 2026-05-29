/**
 * Discriminated union returned by every api-client function.
 * Callers narrow via `if (result.ok) { ... } else { ... }`.
 */
export type ApiResult<T, E = ApiError> = { ok: true; data: T } | { ok: false; error: E }

export type ApiError = {
  code: ApiErrorCode
  message: string
  details?: Record<string, unknown>
}

export type ApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'UPSTREAM_ERROR'
  | 'INTERNAL'

export const ok = <T>(data: T): ApiResult<T> => ({ ok: true, data })
export const err = <T = never>(error: ApiError): ApiResult<T> => ({ ok: false, error })
