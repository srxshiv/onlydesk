import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type { SessionUser, AuthProvider } from '@onlydesk/shared-types'
import { UserEntity } from './entities/user.entity'

const toSessionUser = (u: UserEntity): SessionUser => ({
  id: u.id,
  email: u.email,
  name: u.name,
  avatarUrl: u.avatarUrl,
  providers: u.providers as AuthProvider[],
  createdAt: u.createdAt.toISOString(),
  updatedAt: u.updatedAt.toISOString(),
})

@Injectable()
export class UsersService {
  constructor(@InjectRepository(UserEntity) private readonly repo: Repository<UserEntity>) {}

  async findById(id: string): Promise<SessionUser> {
    const u = await this.repo.findOne({ where: { id } })
    if (!u) throw new NotFoundException()
    return toSessionUser(u)
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { email } })
  }

  async create(input: { email: string; name: string; passwordHash?: string | null; providers: AuthProvider[]; avatarUrl?: string | null }): Promise<UserEntity> {
    const e = this.repo.create({
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash ?? null,
      providers: input.providers,
      avatarUrl: input.avatarUrl ?? null,
    })
    return this.repo.save(e)
  }

  async addProvider(userId: string, provider: AuthProvider): Promise<void> {
    const u = await this.repo.findOne({ where: { id: userId } })
    if (!u) throw new NotFoundException()
    if (!u.providers.includes(provider)) {
      u.providers = [...u.providers, provider]
      await this.repo.save(u)
    }
  }
}
