export type User = {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export type AuthProvider = 'google' | 'github' | 'email'

export type SignUpInput = {
  email: string
  password: string
  name: string
}

export type SignInInput = {
  email: string
  password: string
}

export type AuthTokens = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string
}

export type SessionUser = User & {
  providers: AuthProvider[]
}
