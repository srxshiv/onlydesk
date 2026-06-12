import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ContextService } from './context.service'
import { CustomContextService } from './custom-context.service'
import { isBuiltinScope } from './context.constants'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { RequestUser } from '../common/decorators/current-user.decorator'

/**
 * Unified CRUD over both built-in typed scopes and user-defined custom scopes.
 * The `:scope` param resolves to a built-in table when it is one of the eight
 * known scopes, otherwise it is treated as a custom JSONB-backed scope (which
 * 404s if the user has not defined it).
 */
@Controller('context')
export class ContextController {
  constructor(
    private readonly ctx: ContextService,
    private readonly custom: CustomContextService,
  ) {}

  @Get(':scope')
  list(@CurrentUser() user: RequestUser, @Param('scope') scope: string, @Query('limit') limit?: string, @Query('since') since?: string) {
    const opts = { limit: limit ? Number(limit) : undefined, since }
    if (isBuiltinScope(scope)) return this.ctx.list(user.id, scope, opts)
    return this.custom.listRecords({ id: user.id }, scope, opts)
  }

  @Post(':scope')
  create(@CurrentUser() user: RequestUser, @Param('scope') scope: string, @Body() body: Record<string, unknown>) {
    if (isBuiltinScope(scope)) return this.ctx.create(user.id, scope, body)
    return this.custom.createRecord({ id: user.id }, scope, body)
  }

  @Patch(':scope/:id')
  update(@CurrentUser() user: RequestUser, @Param('scope') scope: string, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    if (isBuiltinScope(scope)) return this.ctx.update(user.id, scope, id, body)
    return this.custom.updateRecord({ id: user.id }, scope, id, body)
  }

  @Delete(':scope/:id')
  async remove(@CurrentUser() user: RequestUser, @Param('scope') scope: string, @Param('id') id: string) {
    if (isBuiltinScope(scope)) await this.ctx.remove(user.id, scope, id)
    else await this.custom.removeRecord({ id: user.id }, scope, id)
    return { ok: true as const }
  }

  @Get(':scope/summary')
  summary(@CurrentUser() user: RequestUser, @Param('scope') scope: string) {
    this.ctx.assertScope(scope)
    return this.ctx.getSummary(user.id, scope)
  }
}
