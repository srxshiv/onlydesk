import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { IsArray, IsObject, IsString } from 'class-validator'
import type { ToolLayout } from '@onlydesk/shared-types'
import { ToolsService } from './tools.service'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { RequestUser } from '../common/decorators/current-user.decorator'

class UpdateGrantsDto {
  @IsArray()
  @IsString({ each: true })
  grants!: string[]
}

class UpdateLayoutsDto {
  /** toolId -> layout; structurally validated in the service. */
  @IsObject()
  layouts!: Record<string, ToolLayout>
}

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

  @Patch('layouts')
  updateLayouts(@CurrentUser() user: RequestUser, @Body() dto: UpdateLayoutsDto) {
    return this.tools.updateLayouts(user.id, dto.layouts)
  }

  @Patch(':toolId/grants')
  updateGrants(@CurrentUser() user: RequestUser, @Param('toolId') toolId: string, @Body() dto: UpdateGrantsDto) {
    return this.tools.updateGrants(user.id, toolId, dto.grants)
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
