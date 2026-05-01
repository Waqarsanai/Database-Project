import { apiClient } from '@/api'
import type { Category } from '@/types/entities'
import type { ListQueryParams, PaginatedResponse } from '@/types/pagination'

export type CategoryQueryParams = ListQueryParams

export interface CreateCategoryDTO {
  categoryName: string
  description: string
}

export interface UpdateCategoryDTO {
  categoryName?: string
  description?: string
}

export const getCategories = (
  params: CategoryQueryParams,
): Promise<PaginatedResponse<Category>> =>
  apiClient.get('/categories', { params }).then((r) => r.data)

export const createCategory = (body: CreateCategoryDTO): Promise<Category> =>
  apiClient.post('/categories', body).then((r) => r.data)

export const updateCategory = (id: string, body: UpdateCategoryDTO): Promise<Category> =>
  apiClient.put(`/categories/${id}`, body).then((r) => r.data)

export const deleteCategory = (id: string): Promise<{ ok: true }> =>
  apiClient.delete(`/categories/${id}`).then((r) => r.data)

