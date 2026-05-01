import { useMemo } from 'react'
import { authStore } from '@/store/authStore'

export function useAuth() {
  const token = authStore((s) => s.token)
  const role = authStore((s) => s.role)
  const user = authStore((s) => s.user)
  const login = authStore((s) => s.login)
  const logout = authStore((s) => s.logout)
  const registerCustomer = authStore((s) => s.registerCustomer)

  return useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      token,
      role,
      user,
      login,
      logout,
      registerCustomer,
    }),
    [token, role, user, login, logout, registerCustomer],
  )
}

