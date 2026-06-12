import { HttpException, HttpStatus } from '@nestjs/common'
import type { ApiError, ApiErrorCode } from '@onlydesk/shared-types'

/**
 * Single source of truth for turning any thrown value — HTTP exception, queue
 * failure, or unexpected error — into the typed `ApiError` contract defined in
 * `@onlydesk/shared-types`. Both the global HTTP filter and the background
 * worker map through here so API responses and queue logs share one shape.
 */

const STATUS_TO_CODE: Record<number, ApiErrorCode> = {
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHENTICATED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_FAILED',
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_FAILED',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
  [HttpStatus.BAD_GATEWAY]: 'UPSTREAM_ERROR',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'UPSTREAM_ERROR',
  [HttpStatus.GATEWAY_TIMEOUT]: 'UPSTREAM_ERROR',
}

const SAFE_MESSAGE: Record<ApiErrorCode, string> = {
  UNAUTHENTICATED: 'Authentication required',
  FORBIDDEN: 'Not allowed',
  NOT_FOUND: 'Not found',
  VALIDATION_FAILED: 'Validation failed',
  CONFLICT: 'Conflict',
  RATE_LIMITED: 'Too many requests',
  UPSTREAM_ERROR: 'Upstream service error',
  INTERNAL: 'Something went wrong',
}

export type MappedError = { status: number; body: ApiError }

/** Map any thrown value into an HTTP status + typed `ApiError` body. */
export function toApiError(exception: unknown): MappedError {
  if (exception instanceof HttpException) {
    const status = exception.getStatus()
    const code = STATUS_TO_CODE[status] ?? 'INTERNAL'
    const raw = exception.getResponse()
    // Validation pipe / custom errors may carry a useful message + details.
    let message = SAFE_MESSAGE[code]
    let details: Record<string, unknown> | undefined
    if (code === 'VALIDATION_FAILED' && raw && typeof raw === 'object') {
      const r = raw as { message?: unknown; details?: Record<string, unknown> }
      if (typeof r.message === 'string') message = r.message
      else if (Array.isArray(r.message)) {
        message = SAFE_MESSAGE.VALIDATION_FAILED
        details = { violations: r.message }
      }
      if (r.details) details = { ...details, ...r.details }
    }
    return { status, body: { code, message, ...(details ? { details } : {}) } }
  }
  return { status: HttpStatus.INTERNAL_SERVER_ERROR, body: { code: 'INTERNAL', message: SAFE_MESSAGE.INTERNAL } }
}

/** Compact, log-safe representation of an error for queue/worker logs. */
export function toCompactError(exception: unknown): { code: ApiErrorCode; message: string } {
  if (exception instanceof HttpException) {
    const { body } = toApiError(exception)
    return { code: body.code, message: exception.message }
  }
  return { code: 'INTERNAL', message: exception instanceof Error ? exception.message : String(exception) }
}
