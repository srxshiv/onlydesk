import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, type ObjectLiteral } from 'typeorm'
import { subject } from '@casl/ability'
import type { ContextScopeId } from '@onlydesk/shared-types'
import { ContextSummaryEntity, EducationEntity, GoalEntity, HealthLogEntity, JobTargetEntity, ProjectEntryEntity, SkillEntity, SocialVoiceEntity, TodoEntity, WorkLogEntity } from './entities'
import { isBuiltinScope } from './context.constants'
import { AbilityFactory } from '../common/casl/ability.factory'

type ScopeRepoMap = {
  work_log: Repository<WorkLogEntity>
  job_target: Repository<JobTargetEntity>
  skills: Repository<SkillEntity>
  projects: Repository<ProjectEntryEntity>
  education: Repository<EducationEntity>
  goals: Repository<GoalEntity>
  social_voice: Repository<SocialVoiceEntity>
  health_log: Repository<HealthLogEntity>
  todos: Repository<TodoEntity>
}

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
    @InjectRepository(TodoEntity) todos: Repository<TodoEntity>,
    @InjectRepository(ContextSummaryEntity) private readonly summaries: Repository<ContextSummaryEntity>,
    private readonly abilities: AbilityFactory,
  ) {
    this.repos = { work_log: workLog, job_target: jobTarget, skills, projects, education, goals, social_voice: socialVoice, health_log: healthLog, todos }
  }

  /** Narrow a route param to a built-in scope id (custom scopes are handled separately). */
  assertScope(scope: string): asserts scope is ContextScopeId {
    if (!isBuiltinScope(scope)) throw new NotFoundException()
  }

  /** Tool-handler guard: a tool may only touch scopes it declared in its manifest. */
  assertAllowed(scope: ContextScopeId, allowed: readonly ContextScopeId[]) {
    if (!allowed.includes(scope)) throw new ForbiddenException()
  }

  /** Service-level CASL gate for user-facing CRUD; defense in depth over userId scoping. */
  private assertCan(userId: string, action: 'read' | 'write'): void {
    const ability = this.abilities.forUser({ id: userId })
    if (!ability.can(action, subject('Context', { userId }))) throw new ForbiddenException()
  }

  async list<S extends ContextScopeId>(userId: string, scope: S, opts: { limit?: number; since?: string } = {}): Promise<ObjectLiteral[]> {
    this.assertCan(userId, 'read')
    const repo = this.repos[scope] as Repository<ObjectLiteral>
    const qb = repo.createQueryBuilder('e').where('e.user_id = :userId', { userId }).orderBy('e.created_at', 'DESC').limit(opts.limit ?? 100)
    if (opts.since) qb.andWhere('e.created_at >= :since', { since: opts.since })
    return qb.getMany()
  }

  async create<S extends ContextScopeId>(userId: string, scope: S, entry: Record<string, unknown>): Promise<ObjectLiteral> {
    this.assertCan(userId, 'write')
    const repo = this.repos[scope] as Repository<ObjectLiteral>
    const saved = await repo.save(repo.create({ ...entry, userId }))
    return saved
  }

  /** Partial update of one entry. Identity columns are never patchable. */
  async update(userId: string, scope: ContextScopeId, id: string, patch: Record<string, unknown>): Promise<ObjectLiteral> {
    this.assertCan(userId, 'write')
    const repo = this.repos[scope] as Repository<ObjectLiteral>
    const row = await repo.findOne({ where: { id, userId } })
    if (!row) throw new NotFoundException()
    const { id: _id, userId: _uid, createdAt: _c, ...safe } = patch
    Object.assign(row, safe)
    return repo.save(row)
  }

  async remove(userId: string, scope: ContextScopeId, id: string): Promise<void> {
    this.assertCan(userId, 'write')
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
