import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import bcrypt from 'bcryptjs'
import type { AuthProvider, AuthTokens, SessionUser } from '@onlydesk/shared-types'
import { UsersService } from '../users/users.service'
import { env } from '../env'

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  private signTokens(user: { id: string; email: string }): AuthTokens {
    const accessToken = this.jwt.sign({ sub: user.id, email: user.email }, { secret: env.JWT_ACCESS_SECRET, expiresIn: env.JWT_ACCESS_TTL })
    const refreshToken = this.jwt.sign({ sub: user.id, email: user.email }, { secret: env.JWT_REFRESH_SECRET, expiresIn: env.JWT_REFRESH_TTL })
    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    }
  }

  async signUp(input: { email: string; name: string; password: string }): Promise<{ user: SessionUser; tokens: AuthTokens }> {
    const existing = await this.users.findByEmail(input.email)
    if (existing) throw new ConflictException()
    const passwordHash = await bcrypt.hash(input.password, 12)
    const created = await this.users.create({ email: input.email, name: input.name, passwordHash, providers: ['email'] })
    const user = await this.users.findById(created.id)
    return { user, tokens: this.signTokens(created) }
  }

  async signIn(input: { email: string; password: string }): Promise<{ user: SessionUser; tokens: AuthTokens }> {
    const u = await this.users.findByEmail(input.email)
    if (!u || !u.passwordHash) throw new UnauthorizedException()
    const ok = await bcrypt.compare(input.password, u.passwordHash)
    if (!ok) throw new UnauthorizedException()
    const user = await this.users.findById(u.id)
    return { user, tokens: this.signTokens(u) }
  }

  async upsertOAuth(input: { provider: AuthProvider; email: string; name: string; avatarUrl?: string | null }): Promise<{ user: SessionUser; tokens: AuthTokens }> {
    let u = await this.users.findByEmail(input.email)
    if (!u) {
      u = await this.users.create({ email: input.email, name: input.name, passwordHash: null, providers: [input.provider], avatarUrl: input.avatarUrl ?? null })
    } else {
      await this.users.addProvider(u.id, input.provider)
    }
    const user = await this.users.findById(u.id)
    return { user, tokens: this.signTokens(u) }
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = this.jwt.verify<{ sub: string; email: string }>(refreshToken, { secret: env.JWT_REFRESH_SECRET })
      return this.signTokens({ id: decoded.sub, email: decoded.email })
    } catch {
      throw new UnauthorizedException()
    }
  }
}
