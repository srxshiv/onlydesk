import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability'
import { Injectable } from '@nestjs/common'

export type Action = 'manage' | 'read' | 'write' | 'invoke' | 'install'
export type Subject = 'User' | 'Tool' | 'Context' | 'all'
/**
 * Subjects here are matched by string tag plus a conditions object (e.g.
 * `{ userId }`), so we keep the ability loosely typed rather than binding it to
 * class subjects. Authorization checks pass `subject('Context', { userId })`.
 */
export type AppAbility = MongoAbility

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
