import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, type ObjectLiteral } from 'typeorm'
import type { ContextScopeId } from '@onlydesk/shared-types'
import { ContextSummaryEntity, EducationEntity, GoalEntity, HealthLogEntity, JobTargetEntity, ProjectEntryEntity, SkillEntity, SocialVoiceEntity, WorkLogEntity } from './entities'

type ScopeRepoMap = {
  work_log: Repository<WorkLogEntity>
  job_target: Repository<JobTargetEntity>
  skills: Repository<SkillEntity>
  projects: Repository<ProjectEntryEntity>
  education: Repository<EducationEntity>
  goals: Repository<GoalEntity>
  social_voice: Repository<SocialVoiceEntity>
  health_log: Repository<HealthLogEntity>
}

const SCOPES: readonly ContextScopeId[] = ['work_log', 'job_target', 'skills', 'projects', 'education', 'goals', 'social_voice', 'health_log']

@Injectable()
export class ContextService {
  private readonly repos: ScopeRepoMap

  constructor(
    @InjectRepository(WorkLogEntity) workLog: Repository<WorkLogEntity>,
    @InjectRepository(JobTargetEntity) jobTarget: Repository<JobTargetEntity>,
    @InjectRepository(SkillEntity) skills: Repository<SkillEntity>,
    @InjectRepository(ProjectEntryEntity) projects: Repository<ProjectEntryEntity>,
    @InjectRepository(EducationEntity) education: Repository<EducationEntity>,
    @InjectRepository(GoalEntity) goals: Repository<GoalEntity>,
    @InjectRepository(SocialVoiceEntity) socialVoice: Repository<SocialVoiceEntity>,
    @InjectRepository(HealthLogEntity) healthLog: Repository<HealthLogEntity>,
    @InjectRepository(ContextSummaryEntity) private readonly summaries: Repository<ContextSummaryEntity>,
  ) {
    this.repos = { work_log: workLog, job_target: jobTarget, skills, projects, education, goals, social_voice: socialVoice, health_log: healthLog }
  }

  assertScope(scope: string): asserts scope is ContextScopeId {
    if (!SCOPES.includes(scope as ContextScopeId)) throw new NotFoundException()
  }

  assertAllowed(scope: ContextScopeId, allowed: readonly ContextScopeId[]) {
    if (!allowed.includes(scope)) throw new ForbiddenException()
  }

  async list<S extends ContextScopeId>(userId: string, scope: S, opts: { limit?: number; since?: string } = {}): Promise<ObjectLiteral[]> {
    const repo = this.repos[scope] as Repository<ObjectLiteral>
    const qb = repo.createQueryBuilder('e').where('e.user_id = :userId', { userId }).orderBy('e.created_at', 'DESC').limit(opts.limit ?? 100)
    if (opts.since) qb.andWhere('e.created_at >= :since', { since: opts.since })
    return qb.getMany()
  }

  async create<S extends ContextScopeId>(userId: string, scope: S, entry: Record<string, unknown>): Promise<ObjectLiteral> {
    const repo = this.repos[scope] as Repository<ObjectLiteral>
    const saved = await repo.save(repo.create({ ...entry, userId }))
    return saved
  }

  async remove(userId: string, scope: ContextScopeId, id: string): Promise<void> {
    const repo = this.repos[scope] as Repository<ObjectLiteral>
    const res = await repo.delete({ id, userId } as Record<string, unknown>)
    if (!res.affected) throw new NotFoundException()
  }

  async getSummary(userId: string, scope: ContextScopeId): Promise<{ scope: ContextScopeId; summary: string; generatedAt: string }> {
    const row = await this.summaries.findOne({ where: { userId, scope } })
    return {
      scope,
      summary: row?.summary ?? '',
      generatedAt: (row?.generatedAt ?? new Date()).toISOString(),
    }
  }
}
