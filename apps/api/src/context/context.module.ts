import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import {
  ContextRecordEntity,
  ContextSchemaEntity,
  ContextSummaryEntity,
  EducationEntity,
  GoalEntity,
  HealthLogEntity,
  JobTargetEntity,
  ProjectEntryEntity,
  SkillEntity,
  SocialVoiceEntity,
  TodoEntity,
  WorkLogEntity,
} from './entities'
import { ContextService } from './context.service'
import { CustomContextService } from './custom-context.service'
import { ContextController } from './context.controller'
import { ContextSchemaController } from './context-schema.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkLogEntity,
      JobTargetEntity,
      SkillEntity,
      ProjectEntryEntity,
      EducationEntity,
      GoalEntity,
      SocialVoiceEntity,
      HealthLogEntity,
      TodoEntity,
      ContextSummaryEntity,
      ContextSchemaEntity,
      ContextRecordEntity,
    ]),
  ],
  providers: [ContextService, CustomContextService],
  // Schema controller is listed first so its static `context/schemas` routes
  // resolve ahead of the generic `context/:scope` routes.
  controllers: [ContextSchemaController, ContextController],
  exports: [ContextService, CustomContextService],
})
export class ContextModule {}
