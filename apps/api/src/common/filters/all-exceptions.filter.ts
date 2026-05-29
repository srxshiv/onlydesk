import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Response } from 'express'

type ErrorBody = { message: string; code: string; details?: Record<string, unknown> }

const sanitize = (status: number, raw: unknown): ErrorBody => {
  if (status === 401) return { message: 'Authentication required', code: 'UNAUTHENTICATED' }
  if (status === 403) return { message: 'Not allowed', code: 'FORBIDDEN' }
  if (status === 404) return { message: 'Not found', code: 'NOT_FOUND' }
  if (status === 409) return { message: 'Conflict', code: 'CONFLICT' }
  if (status === 422) {
    const r = raw as { message?: unknown; details?: Record<string, unknown> }
    return { message: typeof r?.message === 'string' ? r.message : 'Validation failed', code: 'VALIDATION_FAILED', details: r?.details }
  }
  if (status === 429) return { message: 'Too many requests', code: 'RATE_LIMITED' }
  return { message: 'Something went wrong', code: 'INTERNAL' }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const raw = exception instanceof HttpException ? exception.getResponse() : null
    if (status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception))
    }
    res.status(status).json(sanitize(status, raw))
  }
}
