import { Logger, Module, OnModuleInit } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BullModule } from '@nestjs/bullmq'
import { InstalledToolEntity } from './entities/installed-tool.entity'
import { ToolActionInvocationEntity } from './entities/tool-action-invocation.entity'
import { ToolManifestEntity } from './entities/tool-manifest.entity'
import { ToolsService } from './tools.service'
import { ToolsController } from './tools.controller'
import { ToolRegistry } from './tool-registry.service'
import { ToolManifestService } from './tool-manifest.service'
import { ContextModule } from '../context/context.module'
import { McpModule } from '../mcp/mcp.module'
import { AgentsModule } from '../agents/agents.module'
import { TOOL_ACTIONS_QUEUE } from '../jobs/queue.constants'
import { resumeEditorTool } from '@onlydesk/tool-resume-editor'
import { smartTodoTool } from '@onlydesk/tool-smart-todo'

@Module({
  imports: [
    TypeOrmModule.forFeature([InstalledToolEntity, ToolActionInvocationEntity, ToolManifestEntity]),
    BullModule.registerQueue({ name: TOOL_ACTIONS_QUEUE }),
    ContextModule,
    McpModule,
    AgentsModule,
  ],
  providers: [ToolsService, ToolRegistry, ToolManifestService],
  controllers: [ToolsController],
  exports: [ToolsService, ToolRegistry, ToolManifestService],
})
export class ToolsModule implements OnModuleInit {
  constructor(
    private readonly registry: ToolRegistry,
    private readonly manifests: ToolManifestService,
  ) {}

  private readonly logger = new Logger(ToolsModule.name)

  async onModuleInit(): Promise<void> {
    // First-party tools register in-process (for handlers) and are mirrored into
    // the DB registry so the system reaches a predictable, queryable state on boot.
    this.registry.register(resumeEditorTool)
    this.registry.register(smartTodoTool)
    try {
      await this.manifests.upsertBuiltin(this.registry.list())
    } catch (e) {
      // Don't block boot if the schema isn't migrated yet (e.g. first run).
      this.logger.warn(`Skipped DB manifest sync (run migrations?): ${e instanceof Error ? e.message : String(e)}`)
    }
  }
}
