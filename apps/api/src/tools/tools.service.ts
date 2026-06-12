import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type { Queue } from 'bullmq'
import type { ContextScopeId, InstalledTool, ToolActionInvocation, ToolLayout, ToolManifest } from '@onlydesk/shared-types'
import { InstalledToolEntity } from './entities/installed-tool.entity'
import { ToolActionInvocationEntity } from './entities/tool-action-invocation.entity'
import { ToolRegistry } from './tool-registry.service'
import { ContextService } from '../context/context.service'
import { CustomContextService } from '../context/custom-context.service'
import { isBuiltinScope } from '../context/context.constants'
import { McpService } from '../mcp/mcp.service'
import { AgentRunnerService } from '../agents/agent-runner.service'
import { INVOKE_JOB, TOOL_ACTIONS_QUEUE } from '../jobs/queue.constants'

const toInstalled = (e: InstalledToolEntity): InstalledTool => ({
  id: e.id,
  userId: e.userId,
  toolId: e.toolId,
  config: e.config,
  contextGrants: e.contextGrants ?? [],
  layout: e.layout ?? null,
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
  progress: e.progress ?? [],
  startedAt: e.startedAt.toISOString(),
  finishedAt: e.finishedAt ? e.finishedAt.toISOString() : null,
})

@Injectable()
export class ToolsService {
  constructor(
    @InjectRepository(InstalledToolEntity) private readonly installed: Repository<InstalledToolEntity>,
    @InjectRepository(ToolActionInvocationEntity) private readonly invocations: Repository<ToolActionInvocationEntity>,
    @InjectQueue(TOOL_ACTIONS_QUEUE) private readonly queue: Queue,
    private readonly registry: ToolRegistry,
    private readonly context: ContextService,
    private readonly custom: CustomContextService,
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
    const manifest = this.registry.getManifest(toolId)
    const existing = await this.installed.findOne({ where: { userId, toolId } })
    if (existing) throw new ConflictException()
    // Grants start as exactly what the manifest declared; the user owns them after.
    const saved = await this.installed.save(this.installed.create({ userId, toolId, config: {}, contextGrants: [...manifest.contextScopes], enabled: true }))
    return toInstalled(saved)
  }

  async uninstall(userId: string, toolId: string): Promise<void> {
    const res = await this.installed.delete({ userId, toolId })
    if (!res.affected) throw new NotFoundException()
  }

  /**
   * Replace the set of scope keys a tool may read. Every key must be a built-in
   * scope id or one of the caller's own custom-store keys.
   */
  async updateGrants(userId: string, toolId: string, grants: string[]): Promise<InstalledTool> {
    const row = await this.installed.findOne({ where: { userId, toolId } })
    if (!row) throw new NotFoundException()

    const unique = [...new Set(grants)]
    const customKeys = new Set((await this.custom.listSchemas({ id: userId })).map((s) => s.key))
    const invalid = unique.filter((g) => !isBuiltinScope(g) && !customKeys.has(g))
    if (invalid.length) {
      throw new UnprocessableEntityException({
        message: 'Unknown context scopes in grants',
        details: { violations: invalid.map((g) => ({ field: g, message: 'not a built-in scope or one of your custom stores' })) },
      })
    }

    row.contextGrants = unique
    return toInstalled(await this.installed.save(row))
  }

  /**
   * Bulk-save widget placements ({ toolId -> layout }). Unknown tool ids are
   * ignored (the desk may race an uninstall); malformed layouts are rejected.
   */
  async updateLayouts(userId: string, layouts: Record<string, ToolLayout>): Promise<InstalledTool[]> {
    const entries = Object.entries(layouts)
    const violations = entries
      .filter(([, l]) => !l || typeof l.space !== 'string' || !['sm', 'md', 'lg'].includes(l.size) || ![l.x, l.y, l.z, l.order].every(Number.isFinite))
      .map(([toolId]) => ({ field: toolId, message: 'layout must have space, size(sm|md|lg), finite x/y/z/order' }))
    if (violations.length) {
      throw new UnprocessableEntityException({ message: 'Malformed layouts', details: { violations } })
    }

    const rows = await this.installed.find({ where: { userId } })
    const byToolId = new Map(rows.map((r) => [r.toolId, r]))
    const updated: InstalledToolEntity[] = []
    for (const [toolId, layout] of entries) {
      const row = byToolId.get(toolId)
      if (!row) continue
      row.layout = { space: layout.space, size: layout.size, x: layout.x, y: layout.y, z: layout.z, order: layout.order }
      updated.push(row)
    }
    if (updated.length) await this.installed.save(updated)
    return updated.map(toInstalled)
  }

  async invoke(userId: string, toolId: string, actionId: string, input: Record<string, unknown>): Promise<ToolActionInvocation> {
    const def = this.registry.getDefinition(toolId)
    const action = def.manifest.actions.find((a) => a.id === actionId)
    if (!action) throw new NotFoundException()

    const isInstalled = await this.installed.findOne({ where: { userId, toolId } })
    if (!isInstalled) throw new ForbiddenException()

    const row = await this.invocations.save(this.invocations.create({ userId, toolId, actionId, status: 'pending', input }))

    if (action.execution === 'queued') {
      await this.queue.add(INVOKE_JOB, { invocationId: row.id })
      return toInvocation(row)
    }

    // Inline execution path. Reads are gated strictly by the user's grants —
    // the manifest only seeded the defaults.
    const grants = new Set(isInstalled.contextGrants ?? [])
    const assertGranted = (scope: string) => {
      if (!grants.has(scope)) throw new ForbiddenException()
    }
    // stream() appends to the invocation's progress log; the UI polls it.
    const pushProgress = (message: string) => {
      row.progress = [...(row.progress ?? []), { at: new Date().toISOString(), message }]
      void this.invocations.update({ id: row.id }, { progress: row.progress })
    }

    try {
      row.status = 'running'
      await this.invocations.save(row)

      const handler = def.handlers[actionId]
      if (!handler) throw new Error(`Missing handler for action ${actionId}`)

      const result = await handler({
        userId,
        input,
        grantedScopes: [...grants],
        toolConfig: isInstalled.config,
        ctx: {
          read: async (scope, opts) => {
            assertGranted(scope)
            return this.context.list(userId, scope, opts) as never
          },
          readAny: async (scope: string, opts?: { limit?: number; since?: string }) => {
            assertGranted(scope)
            if (isBuiltinScope(scope)) return (await this.context.list(userId, scope, opts)) as Record<string, unknown>[]
            return (await this.custom.listRecords({ id: userId }, scope, opts)).map((r) => ({ id: r.id, createdAt: r.createdAt, ...r.data }))
          },
          write: async (scope, entry) => {
            if (!def.manifest.permissions.write.includes(scope)) throw new ForbiddenException()
            return this.context.create(userId, scope, entry as Record<string, unknown>) as never
          },
          summarize: async (scope) => {
            assertGranted(scope)
            return (await this.context.getSummary(userId, scope)).summary
          },
        },
        stream: (chunk) => pushProgress(typeof chunk.data === 'string' ? chunk.data : JSON.stringify(chunk.data)),
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
