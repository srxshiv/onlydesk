import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Job, Queue } from 'bullmq'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ToolActionInvocationEntity } from '../tools/entities/tool-action-invocation.entity'
import { InstalledToolEntity } from '../tools/entities/installed-tool.entity'
import { ToolRegistry } from '../tools/tool-registry.service'
import { ContextService } from '../context/context.service'
import { CustomContextService } from '../context/custom-context.service'
import { isBuiltinScope } from '../context/context.constants'
import { McpService } from '../mcp/mcp.service'
import { AgentRunnerService } from '../agents/agent-runner.service'
import { TOOL_ACTIONS_DLQ, TOOL_ACTIONS_QUEUE } from './queue.constants'
import { WorkerExceptionFilter } from '../common/errors/worker-exception.filter'
import { env } from '../env'

type InvokeJob = { invocationId: string }

/** Reject after `ms` to bound any single handler execution. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Tool action timed out after ${ms}ms`)), ms)
    promise.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      },
    )
  })
}

/**
 * Executes `queued` tool actions out-of-process. Failures throw so BullMQ
 * applies exponential-backoff retries; once attempts are exhausted the
 * centralized `failed` listener marks the invocation permanently failed and
 * routes a compact record to the dead-letter queue.
 */
@Processor(TOOL_ACTIONS_QUEUE, { concurrency: env.JOB_CONCURRENCY })
export class ToolActionsProcessor extends WorkerHost {
  private readonly logger = new Logger(ToolActionsProcessor.name)
  private readonly errors = new WorkerExceptionFilter(ToolActionsProcessor.name)
  private readonly maxAttempts = env.JOB_ATTEMPTS

  constructor(
    @InjectRepository(ToolActionInvocationEntity) private readonly invocations: Repository<ToolActionInvocationEntity>,
    @InjectRepository(InstalledToolEntity) private readonly installed: Repository<InstalledToolEntity>,
    @InjectQueue(TOOL_ACTIONS_DLQ) private readonly dlq: Queue,
    private readonly registry: ToolRegistry,
    private readonly context: ContextService,
    private readonly custom: CustomContextService,
    private readonly mcp: McpService,
    private readonly runner: AgentRunnerService,
  ) {
    super()
  }

  async process(job: Job<InvokeJob>): Promise<void> {
    const row = await this.invocations.findOne({ where: { id: job.data.invocationId } })
    if (!row) {
      this.logger.warn(`Invocation ${job.data.invocationId} not found; dropping job ${job.id}`)
      return
    }

    row.status = 'running'
    row.error = null
    await this.invocations.save(row)

    const def = this.registry.getDefinition(row.toolId)
    const handler = def.handlers[row.actionId]
    if (!handler) throw new Error(`No handler for ${row.toolId}/${row.actionId}`)

    const installed = await this.installed.findOne({ where: { userId: row.userId, toolId: row.toolId } })
    const toolConfig = installed?.config ?? {}
    // Reads gate strictly on the user's grants (manifest scopes were only the install defaults).
    const grants = new Set(installed?.contextGrants ?? [])
    const assertGranted = (scope: string) => {
      if (!grants.has(scope)) throw new Error(`Scope "${scope}" is not granted to this tool`)
    }
    // stream() appends to the invocation's progress log; the UI polls it.
    const pushProgress = (message: string) => {
      row.progress = [...(row.progress ?? []), { at: new Date().toISOString(), message }]
      void this.invocations.update({ id: row.id }, { progress: row.progress })
    }

    const result = await withTimeout(
      handler({
        userId: row.userId,
        input: row.input,
        grantedScopes: [...grants],
        toolConfig,
        ctx: {
          read: async (scope, opts) => {
            assertGranted(scope)
            return this.context.list(row.userId, scope, opts) as never
          },
          readAny: async (scope: string, opts?: { limit?: number; since?: string }) => {
            assertGranted(scope)
            if (isBuiltinScope(scope)) return (await this.context.list(row.userId, scope, opts)) as Record<string, unknown>[]
            return (await this.custom.listRecords({ id: row.userId }, scope, opts)).map((r) => ({ id: r.id, createdAt: r.createdAt, ...r.data }))
          },
          write: async (scope, entry) => {
            if (!def.manifest.permissions.write.includes(scope)) throw new Error(`Tool not permitted to write scope ${scope}`)
            return this.context.create(row.userId, scope, entry as Record<string, unknown>) as never
          },
          summarize: async (scope) => {
            assertGranted(scope)
            return (await this.context.getSummary(row.userId, scope)).summary
          },
        },
        stream: (chunk) => pushProgress(typeof chunk.data === 'string' ? chunk.data : JSON.stringify(chunk.data)),
        runAgent: async (opts) => this.runner.run(opts),
        getMcpToolset: async () => (def.manifest.mcp ? this.mcp.buildToolset(def.manifest.mcp) : null),
      }),
      env.JOB_TIMEOUT_MS,
    )

    row.status = 'succeeded'
    row.output = (result ?? null) as Record<string, unknown> | null
    row.finishedAt = new Date()
    await this.invocations.save(row)
  }

  @OnWorkerEvent('active')
  onActive(job: Job<InvokeJob>): void {
    this.logger.debug(`job ${job.id} active (attempt ${job.attemptsMade + 1}/${this.maxAttempts}) -> invocation ${job.data.invocationId}`)
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<InvokeJob>): void {
    this.logger.log(`job ${job.id} completed -> invocation ${job.data.invocationId}`)
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<InvokeJob> | undefined, error: Error): Promise<void> {
    if (!job) {
      this.logger.error(`worker failure without job context: ${error?.message}`)
      return
    }
    const maxAttempts = job.opts.attempts ?? this.maxAttempts
    const record = this.errors.capture(error, { jobId: String(job.id), attemptsMade: job.attemptsMade, maxAttempts })
    if (record.willRetry) return

    // Attempts exhausted: persist a compact failure and dead-letter the job.
    await this.invocations.update(
      { id: job.data.invocationId },
      { status: 'failed', error: `[${record.code}] ${record.message}`, finishedAt: new Date() },
    )
    await this.dlq.add(
      'dead-letter',
      { invocationId: job.data.invocationId, originalJobId: job.id, error: record },
      { removeOnComplete: false, removeOnFail: false },
    )
    this.logger.error(`invocation ${job.data.invocationId} dead-lettered after ${job.attemptsMade} attempts`)
  }
}
