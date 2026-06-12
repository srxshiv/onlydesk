import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import type { ToolManifest } from '@onlydesk/shared-types'

/**
 * DB-backed registry of known tool manifests. The in-process `ToolRegistry`
 * remains the source of executable handlers (functions can't be serialized),
 * but the manifest of record lives here — the foundation for the Phase 3
 * marketplace where third-party tools register without a redeploy.
 */
@Entity('tool_manifests')
export class ToolManifestEntity {
  /** Tool id == manifest.id. */
  @PrimaryColumn({ name: 'tool_id', type: 'varchar', length: 128 }) toolId!: string
  @Column({ type: 'varchar', length: 128 }) name!: string
  @Column({ type: 'varchar', length: 32 }) version!: string
  @Column({ type: 'varchar', length: 32 }) category!: string
  @Column({ type: 'jsonb' }) manifest!: ToolManifest
  /** First-party tools shipped with the platform. */
  @Column({ type: 'boolean', default: false }) builtin!: boolean
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date
}
