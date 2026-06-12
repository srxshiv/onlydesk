import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Request, Response } from 'express'
import { toApiError } from '../errors/error-contract'

/**
 * Global HTTP exception filter. Catches every thrown value, maps it to the
 * typed `ApiError` contract from `@onlydesk/shared-types`, and logs server
 * faults with request context. Internal details are never leaked to clients.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const req = ctx.getRequest<Request>()
    const { status, body } = toApiError(exception)

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const detail = exception instanceof Error ? exception.stack : String(exception)
      this.logger.error(`${req.method} ${req.url} -> ${status} ${body.code}\n${detail}`)
    } else if (!(exception instanceof HttpException)) {
      this.logger.warn(`${req.method} ${req.url} -> ${status} ${body.code}`)
    }

    res.status(status).json(body)
  }
}
