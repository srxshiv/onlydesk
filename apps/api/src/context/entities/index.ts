import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm'
import type { CustomFieldDef } from '@onlydesk/shared-types'

@Entity('ctx_work_log')
@Index(['userId', 'date'])
export class WorkLogEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @Column({ name: 'user_id' }) userId!: string
  @Column({ type: 'date' }) date!: string
  @Column({ type: 'varchar', nullable: true }) project!: string | null
  @Column({ type: 'text' }) summary!: string
  @Column({ type: 'text', array: true, default: () => "'{}'" }) tags!: string[]
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date
}

@Entity('ctx_job_target')
export class JobTargetEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @Column({ name: 'user_id' }) userId!: string
  @Column() company!: string
  @Column() role!: string
  @Column({ type: 'text' }) description!: string
  @Column({ type: 'varchar', nullable: true }) url!: string | null
  @Column({ default: 'open' }) status!: string
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date
}

@Entity('ctx_skill')
export class SkillEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @Column({ name: 'user_id' }) userId!: string
  @Column() name!: string
  @Column() level!: string
  @Column({ name: 'years_of_experience', type: 'int', nullable: true }) yearsOfExperience!: number | null
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date
}

@Entity('ctx_project')
export class ProjectEntryEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @Column({ name: 'user_id' }) userId!: string
  @Column() name!: string
  @Column({ type: 'text' }) description!: string
  @Column({ type: 'varchar', nullable: true }) url!: string | null
  @Column({ name: 'start_date', type: 'date' }) startDate!: string
  @Column({ name: 'end_date', type: 'date', nullable: true }) endDate!: string | null
  @Column({ type: 'text', array: true, default: () => "'{}'" }) tech!: string[]
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date
}

@Entity('ctx_education')
export class EducationEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @Column({ name: 'user_id' }) userId!: string
  @Column() institution!: string
  @Column() degree!: string
  @Column() field!: string
  @Column({ name: 'start_date', type: 'date' }) startDate!: string
  @Column({ name: 'end_date', type: 'date', nullable: true }) endDate!: string | null
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date
}

@Entity('ctx_goal')
export class GoalEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @Column({ name: 'user_id' }) userId!: string
  @Column() title!: string
  @Column({ type: 'text' }) description!: string
  @Column({ name: 'target_date', type: 'date', nullable: true }) targetDate!: string | null
  @Column({ default: 'active' }) status!: string
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date
}

@Entity('ctx_social_voice')
export class SocialVoiceEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @Column({ name: 'user_id' }) userId!: string
  @Column() platform!: string
  @Column({ type: 'text' }) content!: string
  @Column({ name: 'posted_at', type: 'timestamptz', nullable: true }) postedAt!: Date | null
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date
}

@Entity('ctx_health_log')
export class HealthLogEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @Column({ name: 'user_id' }) userId!: string
  @Column({ type: 'date' }) date!: string
  @Column() type!: string
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) payload!: Record<string, unknown>
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date
}

@Entity('ctx_todo')
@Index(['userId', 'createdAt'])
export class TodoEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @Column({ name: 'user_id' }) userId!: string
  @Column({ type: 'varchar', length: 512 }) title!: string
  @Column({ name: 'due_date', type: 'date', nullable: true }) dueDate!: string | null
  @Column({ type: 'varchar', length: 16, nullable: true }) time!: string | null
  @Column({ type: 'varchar', length: 16, default: 'none' }) recurrence!: 'none' | 'daily' | 'weekly'
  @Column({ name: 'recurrence_days', type: 'int', array: true, default: () => "'{}'" }) recurrenceDays!: number[]
  @Column({ type: 'text', array: true, default: () => "'{}'" }) tags!: string[]
  /** ISO dates this recurring todo was checked off. */
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) completions!: string[]
  @Column({ type: 'varchar', length: 16, default: 'open' }) status!: 'open' | 'done'
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date
}

@Entity('ctx_summaries')
export class ContextSummaryEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @Column({ name: 'user_id' }) userId!: string
  @Column() scope!: string
  @Column({ type: 'text' }) summary!: string
  @CreateDateColumn({ name: 'generated_at' }) generatedAt!: Date
}

/* ===== Dynamic / user-defined scopes (JSONB-backed, no migration per scope) ===== */

/** Metadata describing a user-defined scope: its slug, name, and field schema. */
@Entity('ctx_custom_schemas')
@Unique(['userId', 'key'])
@Index(['userId'])
export class ContextSchemaEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @Column({ name: 'user_id' }) userId!: string
  @Column({ type: 'varchar', length: 64 }) key!: string
  @Column({ type: 'varchar', length: 128 }) name!: string
  @Column({ type: 'text', nullable: true }) description!: string | null
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) fields!: CustomFieldDef[]
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date
}

/** A single record stored against a custom schema; payload lives in JSONB. */
@Entity('ctx_custom_records')
@Index(['userId', 'schemaId', 'createdAt'])
export class ContextRecordEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @Column({ name: 'user_id' }) userId!: string
  @Column({ name: 'schema_id' }) schemaId!: string
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) data!: Record<string, unknown>
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date
}
