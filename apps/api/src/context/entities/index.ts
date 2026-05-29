import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

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

@Entity('ctx_summaries')
export class ContextSummaryEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @Column({ name: 'user_id' }) userId!: string
  @Column() scope!: string
  @Column({ type: 'text' }) summary!: string
  @CreateDateColumn({ name: 'generated_at' }) generatedAt!: Date
}
