import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { Request } from 'express'
import { env } from '../../env'

type JwtPayload = { sub: string; email: string }

const cookieExtractor = (req: Request): string | null => {
  const c = req.cookies as Record<string, string> | undefined
  return c?.access_token ?? null
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor, ExtractJwt.fromAuthHeaderAsBearerToken()]),
      secretOrKey: env.JWT_ACCESS_SECRET,
      ignoreExpiration: false,
    })
  }

  async validate(payload: JwtPayload): Promise<{ id: string; email: string }> {
    return { id: payload.sub, email: payload.email }
  }
}
