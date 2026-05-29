import { Module, OnModuleInit } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BullModule } from '@nestjs/bullmq'
import { InstalledToolEntity } from './entities/installed-tool.entity'
import { ToolActionInvocationEntity } from './entities/tool-action-invocation.entity'
import { ToolsService } from './tools.service'
import { ToolsController } from './tools.controller'
import { ToolRegistry } from './tool-registry.service'
import { ContextModule } from '../context/context.module'
import { McpModule } from '../mcp/mcp.module'
import { AgentsModule } from '../agents/agents.module'
import { resumeEditorTool } from '@onlydesk/tool-resume-editor'

@Module({
  imports: [
    TypeOrmModule.forFeature([InstalledToolEntity, ToolActionInvocationEntity]),
    BullModule.registerQueue({ name: 'tool-actions' }),
    ContextModule,
    McpModule,
    AgentsModule,
  ],
  providers: [ToolsService, ToolRegistry],
  controllers: [ToolsController],
  exports: [ToolsService, ToolRegistry],
})
export class ToolsModule implements OnModuleInit {
  constructor(private readonly registry: ToolRegistry) {}

  onModuleInit() {
    // First-party tools are registered here. New tools: import and register.
    this.registry.register(resumeEditorTool)
  }
}
