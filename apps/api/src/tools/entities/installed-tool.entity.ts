import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm'

@Entity('installed_tools')
@Unique(['userId', 'toolId'])
@Index(['userId'])
export class InstalledToolEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @Column({ name: 'user_id' }) userId!: string
  @Column({ name: 'tool_id' }) toolId!: string
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) config!: Record<string, unknown>
  @Column({ default: true }) enabled!: boolean
  @CreateDateColumn({ name: 'installed_at' }) installedAt!: Date
}
