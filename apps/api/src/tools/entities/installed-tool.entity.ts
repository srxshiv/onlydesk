import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { encryptedJsonTransformer } from '../../common/crypto/encryption'

@Entity('installed_tools')
@Unique(['userId', 'toolId'])
@Index(['userId'])
export class InstalledToolEntity {
  @PrimaryGeneratedColumn('uuid') id!: string
  @Column({ name: 'user_id' }) userId!: string
  @Column({ name: 'tool_id' }) toolId!: string
  /**
   * Per-tool secrets and config. Stored as an AES-256-GCM envelope in a `text`
   * column; the transformer encrypts on write and decrypts on read, so callers
   * only ever see a plain object.
   */
  @Column({ type: 'text', default: '', transformer: encryptedJsonTransformer }) config!: Record<string, unknown>
  /**
   * Scope keys (built-in ids or custom-store keys) this installation may READ.
   * The manifest's contextScopes are only the defaults seeded at install; the
   * user owns this list afterward — the runtime gates strictly on it.
   */
  @Column({ name: 'context_grants', type: 'jsonb', default: () => "'[]'::jsonb" }) contextGrants!: string[]
  /** Desk placement (space, size, x/y/z, grid order) — synced across devices. */
  @Column({ type: 'jsonb', nullable: true }) layout!: { space: string; size: 'sm' | 'md' | 'lg'; x: number; y: number; z: number; order: number } | null
  @Column({ default: true }) enabled!: boolean
  @CreateDateColumn({ name: 'installed_at' }) installedAt!: Date
}
