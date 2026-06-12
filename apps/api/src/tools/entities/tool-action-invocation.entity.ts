import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('tool_action_invocations')
@Index(['userId', 'startedAt'])
export class ToolActionInvocationEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @Column({ name: 'user_id' }) userId!: string
  @Column({ name: 'tool_id' }) toolId!: string
  @Column({ name: 'action_id' }) actionId!: string
  @Column({ default: 'pending' }) status!: 'pending' | 'running' | 'succeeded' | 'failed'
  @Column({ type: 'jsonb' }) input!: Record<string, unknown>
  @Column({ type: 'jsonb', nullable: true }) output!: Record<string, unknown> | null
  @Column({ type: 'text', nullable: true }) error!: string | null
  /** Live progress beats appended by the running handler's stream(). */
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) progress!: { at: string; message: string }[]
  @CreateDateColumn({ name: 'started_at' }) startedAt!: Date
  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true }) finishedAt!: Date | null
}
