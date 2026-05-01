export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type SortOrder = 'asc' | 'desc'

export interface ListQueryParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  order?: SortOrder
}

