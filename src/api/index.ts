import axios, { AxiosError, type AxiosInstance } from 'axios'
import { authStore } from '@/store/authStore'

export interface ApiErrorShape {
  message: string
  status?: number
  code?: string
  details?: unknown
}

function normalizeError(err: unknown): ApiErrorShape {
  if (axios.isAxiosError(err)) {
    type ErrorResponseBody = { message?: string; error?: string; code?: string } & Record<string, unknown>
    const ax = err as AxiosError<ErrorResponseBody>
    const status = ax.response?.status
    const data = ax.response?.data

    return {
      message:
        data?.message ||
        data?.error ||
        ax.message ||
        'Something went wrong. Please try again.',
      status,
      code: data?.code,
      details: data,
    }
  }

  if (err instanceof Error) return { message: err.message }
  return { message: 'Something went wrong. Please try again.' }
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const token = authStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status

    // 401 handler: refresh token stub (backend will replace with real flow)
    if (status === 401) {
      const { refreshTokenValue, refreshTokenStub } = authStore.getState()
      if (refreshTokenValue && !refreshTokenStub) {
        try {
          authStore.setState({ refreshTokenStub: true })
          await authStore.getState().refreshToken()
          authStore.setState({ refreshTokenStub: false })
          return apiClient.request(error.config)
        } catch {
          authStore.getState().logout()
        }
      }
    }

    return Promise.reject(normalizeError(error))
  },
)

