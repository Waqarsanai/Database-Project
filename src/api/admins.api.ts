import { apiClient } from '@/api'
import type { AdminAccount } from '@/types/entities'
import type { ListQueryParams, PaginatedResponse } from '@/types/pagination'

export interface AdminsQueryParams extends ListQueryParams {
  isActive?: boolean
  role?: AdminAccount['role']
}

export const getAdmins = (params: AdminsQueryParams): Promise<PaginatedResponse<AdminAccount>> =>
  apiClient.get('/admins', { params }).then((r) => r.data)

export const getAdminById = (id: string): Promise<AdminAccount> =>
  apiClient.get(`/admins/${id}`).then((r) => r.data)

export const updateAdmin = (id: string, body: Partial<AdminAccount>): Promise<AdminAccount> =>
  apiClient.put(`/admins/${id}`, body).then((r) => r.data)

export const createAdmin = (body: Partial<AdminAccount> & { username: string; password: string; role: AdminAccount['role'] }): Promise<AdminAccount> =>
  apiClient.post('/admins', body).then((r) => r.data)

