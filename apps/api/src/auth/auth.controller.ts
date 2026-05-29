import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from '@nestjs/common'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { SignInDto, SignUpDto } from './dto/auth.dto'
import { Public } from '../common/decorators/public.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { RequestUser } from '../common/decorators/current-user.decorator'
import { UsersService } from '../users/users.service'
import { env } from '../env'

const cookieOpts = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  domain: env.COOKIE_DOMAIN,
  path: '/',
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Public()
  @Post('sign-up')
  async signUp(@Body() dto: SignUpDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.auth.signUp(dto)
    res.cookie('access_token', tokens.accessToken, cookieOpts)
    res.cookie('refresh_token', tokens.refreshToken, cookieOpts)
    return { user, tokens }
  }

  @Public()
  @Post('sign-in')
  async signIn(@Body() dto: SignInDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.auth.signIn(dto)
    res.cookie('access_token', tokens.accessToken, cookieOpts)
    res.cookie('refresh_token', tokens.refreshToken, cookieOpts)
    return { user, tokens }
  }

  @Post('sign-out')
  signOut(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', cookieOpts)
    res.clearCookie('refresh_token', cookieOpts)
    return { ok: true as const }
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = (req.cookies as Record<string, string> | undefined)?.refresh_token
    if (!token) throw new UnauthorizedException()
    const tokens = await this.auth.refresh(token)
    res.cookie('access_token', tokens.accessToken, cookieOpts)
    res.cookie('refresh_token', tokens.refreshToken, cookieOpts)
    return tokens
  }

  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.users.findById(user.id)
  }
}
