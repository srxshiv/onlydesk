import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BullModule } from '@nestjs/bullmq'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { ToolsModule } from './tools/tools.module'
import { ContextModule } from './context/context.module'
import { McpModule } from './mcp/mcp.module'
import { JobsModule } from './jobs/jobs.module'
import { AgentsModule } from './agents/agents.module'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'
import { dataSourceOptions } from './database/data-source'
import { env } from './env'

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    BullModule.forRoot({ connection: { url: env.REDIS_URL } }),
    AuthModule,
    UsersModule,
    ToolsModule,
    ContextModule,
    McpModule,
    AgentsModule,
    JobsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
