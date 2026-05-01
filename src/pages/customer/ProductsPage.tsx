import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProducts } from '@/api/products.api'
import { getCategories } from '@/api/categories.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pagination } from '@/components/shared/Pagination'
import { ProductCard } from '@/components/shared/ProductCard'
import { useDebounce } from '@/hooks/useDebounce'
import { DEFAULT_PAGE_SIZE } from '@/utils/constants'

export default function CustomerProductsPage() {
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 250)
  const [categoryId, setCategoryId] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stockQty'>('name')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  const categories = useQuery({
    queryKey: ['categories', { page: 1, limit: 50 }],
    queryFn: () => getCategories({ page: 1, limit: 50 }),
  })

  const products = useQuery({
    queryKey: ['products', { page, limit: DEFAULT_PAGE_SIZE, search: debounced, categoryId, sortBy, order }],
    queryFn: () =>
      getProducts({
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: debounced || undefined,
        categoryId: categoryId === 'all' ? undefined : categoryId,
        sortBy,
        order,
      }),
  })

  const rows = products.data?.data ?? []
  const totalPages = products.data?.totalPages ?? 1

  const categoryOptions = useMemo(
    () => [{ id: 'all', name: 'All categories' }, ...(categories.data?.data ?? []).map((c) => ({ id: c.categoryId, name: c.categoryName }))],
    [categories.data],
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Products" description="Browse and add items to your cart." />

      <div className="grid gap-3 rounded-2xl border border-line bg-card p-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search products…"
          />
        </div>
        <Select
          value={categoryId}
          onValueChange={(v) => {
            setCategoryId(v)
            setPage(1)
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'name' | 'price' | 'stockQty')}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="stockQty">Stock</SelectItem>
            </SelectContent>
          </Select>
          <Select value={order} onValueChange={(v) => setOrder(v as 'asc' | 'desc')}>
            <SelectTrigger>
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Asc</SelectItem>
              <SelectItem value="desc">Desc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {products.isLoading ? (
        <div className="rounded-xl border border-line bg-card p-6 text-sm text-muted">Loading products…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <ProductCard key={p.productId} product={p} />
          ))}
        </div>
      )}

      <Pagination page={products.data?.page ?? page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
