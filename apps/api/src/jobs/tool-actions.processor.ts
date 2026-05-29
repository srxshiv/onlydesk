import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ToolActionInvocationEntity } from '../tools/entities/tool-action-invocation.entity'
import { ToolRegistry } from '../tools/tool-registry.service'
import { ContextService } from '../context/context.service'
import { McpService } from '../mcp/mcp.service'
import { AgentRunnerService } from '../agents/agent-runner.service'
import type { ContextScopeId } from '@onlydesk/shared-types'

@Processor('tool-actions')
export class ToolActionsProcessor extends WorkerHost {
  private readonly logger = new Logger(ToolActionsProcessor.name)

  constructor(
    @InjectRepository(ToolActionInvocationEntity) private readonly invocations: Repository<ToolActionInvocationEntity>,
    private readonly registry: ToolRegistry,
    private readonly context: ContextService,
    private readonly mcp: McpService,
    private readonly runner: AgentRunnerService,
  ) {
    super()
  }

  async process(job: Job<{ invocationId: string }>): Promise<void> {
    const row = await this.invocations.findOne({ where: { id: job.data.invocationId } })
    if (!row) {
      this.logger.warn(`Invocation ${job.data.invocationId} not found`)
      return
    }
    try {
      row.status = 'running'
      await this.invocations.save(row)
      const def = this.registry.getDefinition(row.toolId)
      const handler = def.handlers[row.actionId]
      if (!handler) throw new Error(`No handler for ${row.toolId}/${row.actionId}`)
      const declared = def.manifest.contextScopes as ContextScopeId[]
      const result = await handler({
        userId: row.userId,
        input: row.input,
        toolConfig: {},
        ctx: {
          read: async (scope, opts) => {
            this.context.assertAllowed(scope, declared)
            return this.context.list(row.userId, scope, opts) as never
          },
          write: async (scope, entry) => this.context.create(row.userId, scope, entry as Record<string, unknown>) as never,
          summarize: async (scope) => (await this.context.getSummary(row.userId, scope)).summary,
        },
        stream: () => undefined,
        runAgent: async (opts) => this.runner.run(opts),
        getMcpToolset: async () => (def.manifest.mcp ? this.mcp.buildToolset(def.manifest.mcp) : null),
      })
      row.status = 'succeeded'
      row.output = (result ?? null) as Record<string, unknown> | null
    } catch (e: unknown) {
      row.status = 'failed'
      row.error = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      row.finishedAt = new Date()
      await this.invocations.save(row)
    }
  }
}
