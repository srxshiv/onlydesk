import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ToolActionsProcessor } from './tool-actions.processor'
import { TOOL_ACTIONS_DLQ, TOOL_ACTIONS_QUEUE } from './queue.constants'
import { ToolActionInvocationEntity } from '../tools/entities/tool-action-invocation.entity'
import { InstalledToolEntity } from '../tools/entities/installed-tool.entity'
import { ContextModule } from '../context/context.module'
import { McpModule } from '../mcp/mcp.module'
import { AgentsModule } from '../agents/agents.module'
import { ToolsModule } from '../tools/tools.module'

@Module({
  imports: [
    // Main work queue + a dead-letter queue for permanently failed executions.
    BullModule.registerQueue({ name: TOOL_ACTIONS_QUEUE }, { name: TOOL_ACTIONS_DLQ, defaultJobOptions: { attempts: 1, removeOnComplete: false, removeOnFail: false } }),
    TypeOrmModule.forFeature([ToolActionInvocationEntity, InstalledToolEntity]),
    ContextModule,
    McpModule,
    AgentsModule,
    ToolsModule,
  ],
  providers: [ToolActionsProcessor],
})
export class JobsModule {}
