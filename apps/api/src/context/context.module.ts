import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ContextSummaryEntity, EducationEntity, GoalEntity, HealthLogEntity, JobTargetEntity, ProjectEntryEntity, SkillEntity, SocialVoiceEntity, WorkLogEntity } from './entities'
import { ContextService } from './context.service'
import { ContextController } from './context.controller'

@Module({
  imports: [TypeOrmModule.forFeature([WorkLogEntity, JobTargetEntity, SkillEntity, ProjectEntryEntity, EducationEntity, GoalEntity, SocialVoiceEntity, HealthLogEntity, ContextSummaryEntity])],
  providers: [ContextService],
  controllers: [ContextController],
  exports: [ContextService],
})
export class ContextModule {}
