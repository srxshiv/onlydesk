import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BullModule } from '@nestjs/bullmq'
import { CommonModule } from './common/common.module'
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
    BullModule.forRoot({
      connection: { url: env.REDIS_URL },
      // Defaults inherited by every queue: bounded retries with exponential
      // backoff, completed jobs trimmed, failed jobs retained for inspection.
      defaultJobOptions: {
        attempts: env.JOB_ATTEMPTS,
        backoff: { type: 'exponential', delay: env.JOB_BACKOFF_MS },
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: false,
      },
    }),
    CommonModule,
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
