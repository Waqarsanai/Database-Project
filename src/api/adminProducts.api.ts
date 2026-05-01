import { apiClient } from '@/api'
import type { AdminProductAudit } from '@/types/entities'
import type { ListQueryParams, PaginatedResponse } from '@/types/pagination'

export const getAdminProductsAudit = (
  params: ListQueryParams & { adminId?: string; action?: AdminProductAudit['action']; from?: string; to?: string },
): Promise<PaginatedResponse<AdminProductAudit & { adminName?: string; productName?: string }>> =>
  apiClient.get('/admin-products/audit', { params }).then((r) => r.data)

