import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type { ToolManifest } from '@onlydesk/shared-types'
import { ToolManifestEntity } from './entities/tool-manifest.entity'

/**
 * Persists tool manifests into the DB registry. Built-in tools are upserted on
 * boot so the database mirrors the in-process registry; this is also the table
 * a future marketplace loader writes into.
 */
@Injectable()
export class ToolManifestService {
  private readonly logger = new Logger(ToolManifestService.name)

  constructor(@InjectRepository(ToolManifestEntity) private readonly repo: Repository<ToolManifestEntity>) {}

  async upsertBuiltin(manifests: ToolManifest[]): Promise<void> {
    for (const manifest of manifests) {
      // save() upserts by primary key (toolId); avoids deep-partial typing over the jsonb blob.
      await this.repo.save(this.repo.create({ toolId: manifest.id, name: manifest.name, version: manifest.version, category: manifest.category, manifest, builtin: true }))
    }
    this.logger.log(`Synced ${manifests.length} built-in tool manifest(s) to the DB registry`)
  }

  list(): Promise<ToolManifestEntity[]> {
    return this.repo.find({ order: { name: 'ASC' } })
  }
}
