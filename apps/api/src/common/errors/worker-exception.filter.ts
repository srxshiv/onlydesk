import { Logger } from '@nestjs/common'
import type { ApiErrorCode } from '@onlydesk/shared-types'
import { toCompactError } from './error-contract'

/**
 * Specialized error handler for the background worker context. BullMQ jobs do
 * not flow through NestJS HTTP filters, so this class standardizes queue
 * failures into the same typed contract and produces a compact, log-safe record
 * that the processor persists onto the invocation row.
 */
export type WorkerErrorRecord = {
  code: ApiErrorCode
  message: string
  jobId: string
  attemptsMade: number
  willRetry: boolean
}

export class WorkerExceptionFilter {
  private readonly logger: Logger

  constructor(context: string) {
    this.logger = new Logger(context)
  }

  /** Normalize a thrown value into a compact, persistable error record. */
  capture(exception: unknown, meta: { jobId: string; attemptsMade: number; maxAttempts: number }): WorkerErrorRecord {
    const compact = toCompactError(exception)
    const willRetry = meta.attemptsMade < meta.maxAttempts
    const record: WorkerErrorRecord = { ...compact, jobId: meta.jobId, attemptsMade: meta.attemptsMade, willRetry }
    const tag = willRetry ? 'retrying' : 'exhausted'
    this.logger.error(`job ${meta.jobId} failed (${compact.code}, attempt ${meta.attemptsMade}/${meta.maxAttempts}, ${tag}): ${compact.message}`)
    return record
  }
}
