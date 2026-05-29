import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ContextService } from './context.service'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { RequestUser } from '../common/decorators/current-user.decorator'

@Controller('context')
export class ContextController {
  constructor(private readonly ctx: ContextService) {}

  @Get(':scope')
  list(@CurrentUser() user: RequestUser, @Param('scope') scope: string, @Query('limit') limit?: string, @Query('since') since?: string) {
    this.ctx.assertScope(scope)
    return this.ctx.list(user.id, scope, { limit: limit ? Number(limit) : undefined, since })
  }

  @Post(':scope')
  create(@CurrentUser() user: RequestUser, @Param('scope') scope: string, @Body() body: Record<string, unknown>) {
    this.ctx.assertScope(scope)
    return this.ctx.create(user.id, scope, body)
  }

  @Delete(':scope/:id')
  async remove(@CurrentUser() user: RequestUser, @Param('scope') scope: string, @Param('id') id: string) {
    this.ctx.assertScope(scope)
    await this.ctx.remove(user.id, scope, id)
    return { ok: true as const }
  }

  @Get(':scope/summary')
  summary(@CurrentUser() user: RequestUser, @Param('scope') scope: string) {
    this.ctx.assertScope(scope)
    return this.ctx.getSummary(user.id, scope)
  }
}
