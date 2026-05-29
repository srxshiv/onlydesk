import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ToolActionsProcessor } from './tool-actions.processor'
import { ToolActionInvocationEntity } from '../tools/entities/tool-action-invocation.entity'
import { ContextModule } from '../context/context.module'
import { McpModule } from '../mcp/mcp.module'
import { AgentsModule } from '../agents/agents.module'
import { ToolsModule } from '../tools/tools.module'

@Module({
  imports: [BullModule.registerQueue({ name: 'tool-actions' }), TypeOrmModule.forFeature([ToolActionInvocationEntity]), ContextModule, McpModule, AgentsModule, ToolsModule],
  providers: [ToolActionsProcessor],
})
export class JobsModule {}
