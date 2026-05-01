import type { ListQueryParams, PaginatedResponse } from '@/types/pagination'

export function parseListParams(url: URL): Required<ListQueryParams> {
  const page = Number(url.searchParams.get('page') ?? '1')
  const limit = Number(url.searchParams.get('limit') ?? '10')
  const search = url.searchParams.get('search') ?? ''
  const sortBy = url.searchParams.get('sortBy') ?? ''
  const order = (url.searchParams.get('order') ?? 'asc') as 'asc' | 'desc'
  return { page, limit, search, sortBy, order }
}

export function paginate<T>(all: T[], page: number, limit: number): PaginatedResponse<T> {
  const total = all.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const clampedPage = Math.min(Math.max(page, 1), totalPages)
  const start = (clampedPage - 1) * limit
  const data = all.slice(start, start + limit)
  return { data, total, page: clampedPage, limit, totalPages }
}

export function includesText(v: unknown, q: string) {
  if (!q) return true
  return String(v ?? '').toLowerCase().includes(q.toLowerCase())
}

