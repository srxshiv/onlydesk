import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability'
import { Injectable } from '@nestjs/common'

export type Action = 'manage' | 'read' | 'write' | 'invoke' | 'install'
export type Subject = 'User' | 'Tool' | 'Context' | 'all'
export type AppAbility = MongoAbility<[Action, Subject]>

@Injectable()
export class AbilityFactory {
  forUser(user: { id: string }): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility)
    can('read', 'User', { id: user.id })
    can('write', 'User', { id: user.id })
    can('read', 'Context', { userId: user.id })
    can('write', 'Context', { userId: user.id })
    can('install', 'Tool')
    can('invoke', 'Tool', { userId: user.id })
    return build()
  }
}
