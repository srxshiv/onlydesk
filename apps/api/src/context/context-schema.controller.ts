import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { CustomContextService } from './custom-context.service'
import { CreateContextSchemaDto, UpdateContextSchemaDto } from './dto/context-schema.dto'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { RequestUser } from '../common/decorators/current-user.decorator'

/**
 * Management of user-defined context scope definitions. Registered ahead of the
 * generic `/context/:scope` routes so the static `schemas` path wins.
 */
@Controller('context/schemas')
export class ContextSchemaController {
  constructor(private readonly custom: CustomContextService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.custom.listSchemas({ id: user.id })
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateContextSchemaDto) {
    return this.custom.createSchema({ id: user.id }, dto)
  }

  @Get(':key')
  get(@CurrentUser() user: RequestUser, @Param('key') key: string) {
    return this.custom.getSchema({ id: user.id }, key)
  }

  @Patch(':key')
  update(@CurrentUser() user: RequestUser, @Param('key') key: string, @Body() dto: UpdateContextSchemaDto) {
    return this.custom.updateSchema({ id: user.id }, key, dto)
  }

  @Delete(':key')
  async remove(@CurrentUser() user: RequestUser, @Param('key') key: string) {
    await this.custom.deleteSchema({ id: user.id }, key)
    return { ok: true as const }
  }
}
