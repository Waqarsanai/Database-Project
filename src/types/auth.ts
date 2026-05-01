export type AppRole = 'admin' | 'customer'

export interface JwtPayload {
  sub: string
  role: AppRole
  exp: number
}

export interface AuthUserBase {
  id: string
  firstName: string
  lastName: string
  email: string
  username: string
}

export interface AuthSession {
  token: string
  refreshToken: string
  role: AppRole
  user: AuthUserBase
}

