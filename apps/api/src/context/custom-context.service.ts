import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { subject } from '@casl/ability'
import type { CustomContextRecord, CustomScopeDefinition } from '@onlydesk/shared-types'
import { ContextRecordEntity, ContextSchemaEntity } from './entities'
import { isBuiltinScope } from './context.constants'
import { validateFieldDefs, validateRecord } from './context-validation'
import { AbilityFactory } from '../common/casl/ability.factory'
import type { CreateContextSchemaDto, UpdateContextSchemaDto } from './dto/context-schema.dto'

type Actor = { id: string }

const toDefinition = (e: ContextSchemaEntity): CustomScopeDefinition => ({
  id: e.id,
  userId: e.userId,
  key: e.key,
  name: e.name,
  description: e.description,
  fields: e.fields,
  createdAt: e.createdAt.toISOString(),
  updatedAt: e.updatedAt.toISOString(),
})

const toRecord = (e: ContextRecordEntity, scopeKey: string): CustomContextRecord => ({
  id: e.id,
  userId: e.userId,
  scopeKey,
  data: e.data,
  createdAt: e.createdAt.toISOString(),
})

/**
 * Manages user-defined ("custom") context scopes. Schemas live in
 * `ctx_custom_schemas`; their records live as JSONB in `ctx_custom_records`.
 * A new scope therefore requires no native migration. Every read/write asserts
 * the caller's CASL ability and is hard-scoped to the owning user.
 */
@Injectable()
export class CustomContextService {
  constructor(
    @InjectRepository(ContextSchemaEntity) private readonly schemas: Repository<ContextSchemaEntity>,
    @InjectRepository(ContextRecordEntity) private readonly records: Repository<ContextRecordEntity>,
    private readonly abilities: AbilityFactory,
  ) {}

  /** Service-level CASL gate — defense in depth on top of per-query userId scoping. */
  private assertAllowed(user: Actor, action: 'read' | 'write'): void {
    const ability = this.abilities.forUser(user)
    if (!ability.can(action, subject('Context', { userId: user.id }))) throw new ForbiddenException()
  }

  private rejectReservedKey(key: string): void {
    if (isBuiltinScope(key) || key === 'schemas' || key === 'summary') throw new ConflictException(`"${key}" is a reserved scope name`)
  }

  // ===== Schema definitions =====

  async createSchema(user: Actor, dto: CreateContextSchemaDto): Promise<CustomScopeDefinition> {
    this.assertAllowed(user, 'write')
    this.rejectReservedKey(dto.key)
    const exists = await this.schemas.findOne({ where: { userId: user.id, key: dto.key } })
    if (exists) throw new ConflictException(`Scope "${dto.key}" already exists`)
    const fields = validateFieldDefs(dto.fields)
    const saved = await this.schemas.save(
      this.schemas.create({ userId: user.id, key: dto.key, name: dto.name, description: dto.description ?? null, fields }),
    )
    return toDefinition(saved)
  }

  async listSchemas(user: Actor): Promise<CustomScopeDefinition[]> {
    this.assertAllowed(user, 'read')
    const rows = await this.schemas.find({ where: { userId: user.id }, order: { createdAt: 'DESC' } })
    return rows.map(toDefinition)
  }

  async getSchema(user: Actor, key: string): Promise<CustomScopeDefinition> {
    return toDefinition(await this.requireSchemaEntity(user, key, 'read'))
  }

  async updateSchema(user: Actor, key: string, dto: UpdateContextSchemaDto): Promise<CustomScopeDefinition> {
    const entity = await this.requireSchemaEntity(user, key, 'write')
    if (dto.name !== undefined) entity.name = dto.name
    if (dto.description !== undefined) entity.description = dto.description
    if (dto.fields !== undefined) entity.fields = validateFieldDefs(dto.fields)
    return toDefinition(await this.schemas.save(entity))
  }

  async deleteSchema(user: Actor, key: string): Promise<void> {
    const entity = await this.requireSchemaEntity(user, key, 'write')
    // Records reference the schema; remove them explicitly (no DB-level cascade on JSONB store).
    await this.records.delete({ userId: user.id, schemaId: entity.id })
    await this.schemas.delete({ id: entity.id })
  }

  // ===== Records =====

  async listRecords(user: Actor, key: string, opts: { limit?: number; since?: string } = {}): Promise<CustomContextRecord[]> {
    const schema = await this.requireSchemaEntity(user, key, 'read')
    const qb = this.records
      .createQueryBuilder('r')
      .where('r.user_id = :userId AND r.schema_id = :schemaId', { userId: user.id, schemaId: schema.id })
      .orderBy('r.created_at', 'DESC')
      .limit(Math.min(opts.limit ?? 100, 500))
    if (opts.since) qb.andWhere('r.created_at >= :since', { since: opts.since })
    const rows = await qb.getMany()
    return rows.map((r) => toRecord(r, key))
  }

  async createRecord(user: Actor, key: string, body: unknown): Promise<CustomContextRecord> {
    const schema = await this.requireSchemaEntity(user, key, 'write')
    const data = validateRecord(schema.fields, body)
    const saved = await this.records.save(this.records.create({ userId: user.id, schemaId: schema.id, data }))
    return toRecord(saved, key)
  }

  /** Merge-patch a record's data; the merged payload re-validates against the schema. */
  async updateRecord(user: Actor, key: string, id: string, patch: unknown): Promise<CustomContextRecord> {
    const schema = await this.requireSchemaEntity(user, key, 'write')
    const row = await this.records.findOne({ where: { id, userId: user.id, schemaId: schema.id } })
    if (!row) throw new NotFoundException()
    const merged = { ...row.data, ...(typeof patch === 'object' && patch !== null ? (patch as Record<string, unknown>) : {}) }
    row.data = validateRecord(schema.fields, merged)
    return toRecord(await this.records.save(row), key)
  }

  async removeRecord(user: Actor, key: string, id: string): Promise<void> {
    const schema = await this.requireSchemaEntity(user, key, 'write')
    const res = await this.records.delete({ id, userId: user.id, schemaId: schema.id })
    if (!res.affected) throw new NotFoundException()
  }

  /** Does this user have a custom scope with the given key? */
  async exists(user: Actor, key: string): Promise<boolean> {
    return (await this.schemas.count({ where: { userId: user.id, key } })) > 0
  }

  private async requireSchemaEntity(user: Actor, key: string, action: 'read' | 'write'): Promise<ContextSchemaEntity> {
    this.assertAllowed(user, action)
    const entity = await this.schemas.findOne({ where: { userId: user.id, key } })
    if (!entity) throw new NotFoundException(`Unknown context scope "${key}"`)
    return entity
  }
}
