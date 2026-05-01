import { apiClient } from '@/api'
import type { Product } from '@/types/entities'
import type { ListQueryParams, PaginatedResponse } from '@/types/pagination'

export interface ProductQueryParams extends ListQueryParams {
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  stock?: 'in_stock' | 'out_of_stock' | 'low_stock'
}

export interface CreateProductDTO {
  name: string
  price: number
  stockQty: number
  categoryId: string
}

export interface UpdateProductDTO {
  name?: string
  price?: number
  stockQty?: number
  categoryId?: string
}

export const getProducts = (
  params: ProductQueryParams,
): Promise<PaginatedResponse<Product>> =>
  apiClient.get('/products', { params }).then((r) => r.data)

export const getProductById = (id: string): Promise<Product> =>
  apiClient.get(`/products/${id}`).then((r) => r.data)

export const createProduct = (body: CreateProductDTO): Promise<Product> =>
  apiClient.post('/products', body).then((r) => r.data)

export const updateProduct = (id: string, body: UpdateProductDTO): Promise<Product> =>
  apiClient.put(`/products/${id}`, body).then((r) => r.data)

export const deleteProduct = (id: string): Promise<{ ok: true }> =>
  apiClient.delete(`/products/${id}`).then((r) => r.data)

