import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ToolsService } from './tools.service'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { RequestUser } from '../common/decorators/current-user.decorator'

@Controller('tools')
export class ToolsController {
  constructor(private readonly tools: ToolsService) {}

  @Get('available')
  available() {
    return this.tools.listAvailable()
  }

  @Get('installed')
  installed(@CurrentUser() user: RequestUser) {
    return this.tools.listInstalled(user.id)
  }

  @Post(':toolId/install')
  install(@CurrentUser() user: RequestUser, @Param('toolId') toolId: string) {
    return this.tools.install(user.id, toolId)
  }

  @Post(':toolId/uninstall')
  async uninstall(@CurrentUser() user: RequestUser, @Param('toolId') toolId: string) {
    await this.tools.uninstall(user.id, toolId)
    return { ok: true as const }
  }

  @Post(':toolId/actions/:actionId')
  invoke(@CurrentUser() user: RequestUser, @Param('toolId') toolId: string, @Param('actionId') actionId: string, @Body() body: Record<string, unknown>) {
    return this.tools.invoke(user.id, toolId, actionId, body)
  }

  @Get('invocations/:id')
  invocation(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.tools.getInvocation(user.id, id)
  }
}
