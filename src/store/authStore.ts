import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { jwtDecode } from 'jwt-decode'
import type { AppRole, AuthSession, JwtPayload } from '@/types/auth'
import * as authApi from '@/api/auth.api'

interface AuthState {
  token: string | null
  refreshTokenValue: string | null
  role: AppRole | null
  user: AuthSession['user'] | null
  refreshTokenStub: boolean
  login: (args: { username: string; password: string; role: AppRole }) => Promise<void>
  registerCustomer: (args: authApi.RegisterCustomerDTO) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

function readRoleFromToken(token: string): AppRole | null {
  try {
    const payload = jwtDecode<JwtPayload>(token)
    return payload.role ?? null
  } catch {
    return null
  }
}

export const authStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshTokenValue: null,
      role: null,
      user: null,
      refreshTokenStub: false,
      login: async ({ username, password, role }) => {
        const session = await authApi.login({ username, password, role })
        set({
          token: session.token,
          refreshTokenValue: session.refreshToken,
          role: readRoleFromToken(session.token) ?? session.role,
          user: session.user,
        })
      },
      registerCustomer: async (args) => {
        const session = await authApi.register(args)
        set({
          token: session.token,
          refreshTokenValue: session.refreshToken,
          role: readRoleFromToken(session.token) ?? session.role,
          user: session.user,
        })
      },
      logout: () => {
        set({ token: null, refreshTokenValue: null, role: null, user: null })
        void authApi.logout().catch(() => undefined)
      },
      refreshToken: async () => {
        const rt = get().refreshTokenValue
        if (!rt) throw new Error('No refresh token')
        const session = await authApi.refresh()
        set({
          token: session.token,
          refreshTokenValue: session.refreshToken,
          role: readRoleFromToken(session.token) ?? session.role,
          user: session.user,
        })
      },
    }),
    {
      name: 'iims-auth',
      partialize: (s) => ({ token: s.token, refreshTokenValue: s.refreshTokenValue, role: s.role, user: s.user }),
    },
  ),
)

