import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ToolManifestSchema, type ToolDefinition } from '@onlydesk/tools-sdk'
import type { ContextScopeId, ToolManifest } from '@onlydesk/shared-types'

/**
 * In-process registry of first-party tools. Tool packages export a
 * ToolDefinition; we validate the manifest at registration time and
 * keep handlers reachable by toolId+actionId for invocation.
 *
 * Third-party / dynamic tools (Phase 3) will register here too via a
 * loader that imports manifests from a marketplace; same shape.
 */
@Injectable()
export class ToolRegistry {
  private readonly logger = new Logger(ToolRegistry.name)
  private readonly tools = new Map<string, ToolDefinition<ContextScopeId>>()

  register(def: ToolDefinition<ContextScopeId>): void {
    const parsed = ToolManifestSchema.safeParse(def.manifest)
    if (!parsed.success) throw new Error(`Invalid manifest for tool "${def.manifest.id}": ${parsed.error.message}`)
    if (this.tools.has(def.manifest.id)) throw new Error(`Tool already registered: ${def.manifest.id}`)
    this.tools.set(def.manifest.id, def)
    this.logger.log(`Registered tool: ${def.manifest.id} v${def.manifest.version}`)
  }

  list(): ToolManifest[] {
    return Array.from(this.tools.values()).map((t) => t.manifest)
  }

  getManifest(id: string): ToolManifest {
    const t = this.tools.get(id)
    if (!t) throw new NotFoundException()
    return t.manifest
  }

  getDefinition(id: string): ToolDefinition<ContextScopeId> {
    const t = this.tools.get(id)
    if (!t) throw new NotFoundException()
    return t
  }
}
