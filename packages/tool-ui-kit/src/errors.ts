import type { ApiError, ApiErrorCode, ApiResult } from '@onlydesk/shared-types'

/**
 * Error thrown by query/mutation hooks when an ApiResult is not ok. Carries the
 * typed error contract from shared-types so UI can branch on `code` and render
 * validation violations from `details`.
 */
export class ApiRequestError extends Error {
  readonly code: ApiErrorCode
  readonly details?: Record<string, unknown>

  constructor(error: ApiError) {
    super(error.message)
    this.name = 'ApiRequestError'
    this.code = error.code
    this.details = error.details
  }

  /** Structured validation violations, when the server provided them. */
  get violations(): { field: string; message: string }[] {
    const v = this.details?.violations
    return Array.isArray(v) ? (v as { field: string; message: string }[]) : []
  }
}

/** Narrow any unknown error (from react-query) back to the typed contract. */
export const asApiError = (e: unknown): ApiRequestError =>
  e instanceof ApiRequestError ? e : new ApiRequestError({ code: 'INTERNAL', message: e instanceof Error ? e.message : 'Something went wrong' })

/** Unwrap an ApiResult, throwing the typed error for react-query to surface. */
export const unwrap = async <T>(p: Promise<ApiResult<T>>): Promise<T> => {
  const r = await p
  if (!r.ok) throw new ApiRequestError(r.error)
  return r.data
}
