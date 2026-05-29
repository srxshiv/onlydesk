import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type { Queue } from 'bullmq'
import type { ContextScopeId, InstalledTool, ToolActionInvocation, ToolManifest } from '@onlydesk/shared-types'
import { InstalledToolEntity } from './entities/installed-tool.entity'
import { ToolActionInvocationEntity } from './entities/tool-action-invocation.entity'
import { ToolRegistry } from './tool-registry.service'
import { ContextService } from '../context/context.service'
import { McpService } from '../mcp/mcp.service'
import { AgentRunnerService } from '../agents/agent-runner.service'

const toInstalled = (e: InstalledToolEntity): InstalledTool => ({
  id: e.id,
  userId: e.userId,
  toolId: e.toolId,
  config: e.config,
  enabled: e.enabled,
  installedAt: e.installedAt.toISOString(),
})

const toInvocation = (e: ToolActionInvocationEntity): ToolActionInvocation => ({
  id: e.id,
  userId: e.userId,
  toolId: e.toolId,
  actionId: e.actionId,
  status: e.status,
  input: e.input,
  output: e.output,
  error: e.error,
  startedAt: e.startedAt.toISOString(),
  finishedAt: e.finishedAt ? e.finishedAt.toISOString() : null,
})

@Injectable()
export class ToolsService {
  constructor(
    @InjectRepository(InstalledToolEntity) private readonly installed: Repository<InstalledToolEntity>,
    @InjectRepository(ToolActionInvocationEntity) private readonly invocations: Repository<ToolActionInvocationEntity>,
    @InjectQueue('tool-actions') private readonly queue: Queue,
    private readonly registry: ToolRegistry,
    private readonly context: ContextService,
    private readonly mcp: McpService,
    private readonly runner: AgentRunnerService,
  ) {}

  listAvailable(): ToolManifest[] {
    return this.registry.list()
  }

  async listInstalled(userId: string): Promise<InstalledTool[]> {
    const rows = await this.installed.find({ where: { userId } })
    return rows.map(toInstalled)
  }

  async install(userId: string, toolId: string): Promise<InstalledTool> {
    this.registry.getManifest(toolId)
    const existing = await this.installed.findOne({ where: { userId, toolId } })
    if (existing) throw new ConflictException()
    const saved = await this.installed.save(this.installed.create({ userId, toolId, config: {}, enabled: true }))
    return toInstalled(saved)
  }

  async uninstall(userId: string, toolId: string): Promise<void> {
    const res = await this.installed.delete({ userId, toolId })
    if (!res.affected) throw new NotFoundException()
  }

  async invoke(userId: string, toolId: string, actionId: string, input: Record<string, unknown>): Promise<ToolActionInvocation> {
    const def = this.registry.getDefinition(toolId)
    const action = def.manifest.actions.find((a) => a.id === actionId)
    if (!action) throw new NotFoundException()

    const isInstalled = await this.installed.findOne({ where: { userId, toolId } })
    if (!isInstalled) throw new ForbiddenException()

    const row = await this.invocations.save(this.invocations.create({ userId, toolId, actionId, status: 'pending', input }))

    if (action.execution === 'queued') {
      await this.queue.add('invoke', { invocationId: row.id })
      return toInvocation(row)
    }

    // Inline execution path
    try {
      row.status = 'running'
      await this.invocations.save(row)

      const handler = def.handlers[actionId]
      if (!handler) throw new Error(`Missing handler for action ${actionId}`)

      const declaredScopes = def.manifest.contextScopes as ContextScopeId[]
      const result = await handler({
        userId,
        input,
        toolConfig: isInstalled.config,
        ctx: {
          read: async (scope, opts) => {
            this.context.assertAllowed(scope, declaredScopes)
            return this.context.list(userId, scope, opts) as never
          },
          write: async (scope, entry) => {
            if (!def.manifest.permissions.write.includes(scope)) throw new ForbiddenException()
            return this.context.create(userId, scope, entry as Record<string, unknown>) as never
          },
          summarize: async (scope) => {
            this.context.assertAllowed(scope, declaredScopes)
            return (await this.context.getSummary(userId, scope)).summary
          },
        },
        stream: () => undefined,
        runAgent: async (opts) => this.runner.run(opts),
        getMcpToolset: async () => (def.manifest.mcp ? this.mcp.buildToolset(def.manifest.mcp) : null),
      })

      row.status = 'succeeded'
      row.output = (result ?? null) as Record<string, unknown> | null
      row.finishedAt = new Date()
      await this.invocations.save(row)
    } catch (e: unknown) {
      row.status = 'failed'
      row.error = e instanceof Error ? e.message : 'Unknown error'
      row.finishedAt = new Date()
      await this.invocations.save(row)
    }

    return toInvocation(row)
  }

  async getInvocation(userId: string, id: string): Promise<ToolActionInvocation> {
    const row = await this.invocations.findOne({ where: { id, userId } })
    if (!row) throw new NotFoundException()
    return toInvocation(row)
  }
}
