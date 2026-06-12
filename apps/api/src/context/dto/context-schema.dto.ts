import { IsArray, IsOptional, IsString, Matches, MaxLength } from 'class-validator'
import { SCOPE_KEY_RE } from '../context-validation'

export class CreateContextSchemaDto {
  @IsString()
  @Matches(SCOPE_KEY_RE, { message: 'key must match /^[a-z][a-z0-9_-]{1,63}$/' })
  key!: string

  @IsString()
  @MaxLength(128)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(512)
  description?: string

  /** Field definitions; structurally validated in the service layer. */
  @IsArray()
  fields!: unknown[]
}

export class UpdateContextSchemaDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(512)
  description?: string

  @IsOptional()
  @IsArray()
  fields?: unknown[]
}
