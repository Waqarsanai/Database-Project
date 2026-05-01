import { apiClient } from '@/api'
import type { AuthSession, AppRole } from '@/types/auth'

export interface LoginDTO {
  username: string
  password: string
  role: AppRole
}

export interface RegisterCustomerDTO {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  address: string
}

export const login = (body: LoginDTO): Promise<AuthSession> =>
  apiClient.post('/auth/login', body).then((r) => r.data)

export const register = (body: RegisterCustomerDTO): Promise<AuthSession> =>
  apiClient.post('/auth/register', body).then((r) => r.data)

export const logout = (): Promise<{ ok: true }> =>
  apiClient.post('/auth/logout').then((r) => r.data)

export const refresh = (): Promise<AuthSession> =>
  apiClient.post('/auth/refresh').then((r) => r.data)

