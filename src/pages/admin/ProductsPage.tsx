import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { createProduct, deleteProduct, getProducts, updateProduct } from '@/api/products.api'
import { getCategories } from '@/api/categories.api'
import type { Product } from '@/types/entities'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Pagination } from '@/components/shared/Pagination'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { STOCK_THRESHOLDS } from '@/utils/constants'
import { formatCurrency } from '@/utils/format'
import { useDebounce } from '@/hooks/useDebounce'
import { getErrorMessage } from '@/utils/errors'

const schema = z.object({
  name: z.string().min(2),
  price: z.number().positive(),
  stockQty: z.number().int().min(0),
  categoryId: z.string().min(1),
})
type FormValues = z.infer<typeof schema>

function stockBadge(stockQty: number) {
  if (stockQty === 0) return <Badge variant="destructive">Out</Badge>
  if (stockQty < STOCK_THRESHOLDS.critical) return <Badge variant="destructive">Critical</Badge>
  if (stockQty < STOCK_THRESHOLDS.low) return <Badge variant="warning">Low</Badge>
  return <Badge variant="success">Healthy</Badge>
}

export default function AdminProductsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 250)
  const [categoryId, setCategoryId] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stockQty'>('name')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [edit, setEdit] = useState<Product | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const categories = useQuery({
    queryKey: ['categories', { page: 1, limit: 100 }],
    queryFn: () => getCategories({ page: 1, limit: 100 }),
  })

  const products = useQuery({
    queryKey: ['products', { page, search: debounced, categoryId, sortBy, order }],
    queryFn: () =>
      getProducts({
        page,
        limit: 10,
        search: debounced || undefined,
        categoryId: categoryId === 'all' ? undefined : categoryId,
        sortBy,
        order,
      }),
  })

  const createM = useMutation({
    mutationFn: (values: FormValues) => createProduct(values),
    onSuccess: async () => {
      toast.success('Product created')
      await qc.invalidateQueries({ queryKey: ['products'] })
      await qc.invalidateQueries({ queryKey: ['analytics'] })
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Create failed')),
  })

  const updateM = useMutation({
    mutationFn: ({ id, values }: { id: string; values: FormValues }) => updateProduct(id, values),
    onSuccess: async () => {
      toast.success('Product updated')
      await qc.invalidateQueries({ queryKey: ['products'] })
      await qc.invalidateQueries({ queryKey: ['analytics'] })
      setEdit(null)
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Update failed')),
  })

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: async () => {
      toast.success('Product deleted')
      setConfirmDeleteId(null)
      await qc.invalidateQueries({ queryKey: ['products'] })
      await qc.invalidateQueries({ queryKey: ['analytics'] })
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Delete failed')),
  })

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => deleteProduct(id)))
    },
    onSuccess: async () => {
      toast.success('Deleted selected')
      setSelectedIds([])
      await qc.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const bulkRestock = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => updateProduct(id, { stockQty: 50 })))
    },
    onSuccess: async () => {
      toast.success('Restocked selected')
      setSelectedIds([])
      await qc.invalidateQueries({ queryKey: ['products'] })
      await qc.invalidateQueries({ queryKey: ['analytics', 'low-stock'] })
    },
  })

  const form = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onChange' })

  const categoryOptions = useMemo(
    () => [{ id: 'all', name: 'All categories' }, ...(categories.data?.data ?? []).map((c) => ({ id: c.categoryId, name: c.categoryName }))],
    [categories.data],
  )

  const rows = products.data?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage catalog, stock, and pricing."
        actions={
          <div className="flex items-center gap-2">
            {selectedIds.length ? (
              <>
                <Button variant="outline" onClick={() => bulkRestock.mutate(selectedIds)}>
                  Restock selected
                </Button>
                <Button variant="destructive" onClick={() => bulkDelete.mutate(selectedIds)}>
                  <Trash2 className="h-4 w-4" />
                  Delete selected
                </Button>
              </>
            ) : null}
            <Dialog
              onOpenChange={(open) => {
                if (!open) form.reset()
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" />
                  Add product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add product</DialogTitle>
                </DialogHeader>
                <form
                  className="space-y-4"
                  onSubmit={form.handleSubmit(async (values) => createM.mutate(values))}
                >
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input {...form.register('name')} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Price</Label>
                      <Input type="number" step="0.01" {...form.register('price', { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Stock Qty</Label>
                      <Input type="number" {...form.register('stockQty', { valueAsNumber: true })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select onValueChange={(v) => form.setValue('categoryId', v, { shouldValidate: true })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {(categories.data?.data ?? []).map((c) => (
                          <SelectItem key={c.categoryId} value={c.categoryId}>
                            {c.categoryName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={!form.formState.isValid || createM.isPending}>
                      {createM.isPending ? 'Creating…' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid gap-3 rounded-2xl border border-line bg-card p-4 md:grid-cols-4">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Search products…"
          className="md:col-span-2"
        />
        <Select
          value={categoryId}
          onValueChange={(v) => {
            setCategoryId(v)
            setPage(1)
          }}
        >
          <SelectTrigger>
            <SelectValue />
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
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="stockQty">Stock</SelectItem>
            </SelectContent>
          </Select>
          <Select value={order} onValueChange={(v) => setOrder(v as 'asc' | 'desc')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Asc</SelectItem>
              <SelectItem value="desc">Desc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        rows={rows}
        rowId={(r) => r.productId}
        selectable
        onSelectionChange={setSelectedIds}
        columns={[
          { key: 'id', header: 'ProductID', cell: (r) => <span className="font-mono text-xs text-muted">{r.productId}</span> },
          { key: 'name', header: 'Name', cell: (r) => <button className="font-medium hover:underline" onClick={() => setEdit(r)}>{r.name}</button> },
          { key: 'category', header: 'Category', cell: (r) => <span className="text-muted">{r.category?.categoryName ?? r.categoryId}</span> },
          { key: 'price', header: 'Price', cell: (r) => <span className="font-medium">{formatCurrency(r.price)}</span> },
          { key: 'stock', header: 'Stock', cell: (r) => <div className="flex items-center gap-2">{stockBadge(r.stockQty)}<span className="text-muted">{r.stockQty}</span></div> },
          {
            key: 'actions',
            header: 'Actions',
            cell: (r) => (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setEdit(r)}>
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setConfirmDeleteId(r.productId)}>
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        empty={<div className="text-sm text-muted">No products found.</div>}
      />

      <Pagination page={products.data?.page ?? page} totalPages={products.data?.totalPages ?? 1} onPageChange={setPage} />

      <Dialog open={Boolean(edit)} onOpenChange={(open) => (!open ? setEdit(null) : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit product</DialogTitle>
          </DialogHeader>
          {edit ? (
            <EditProductForm
              product={edit}
              categories={categories.data?.data ?? []}
              onCancel={() => setEdit(null)}
              onSave={(values) => updateM.mutate({ id: edit.productId, values })}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        title="Delete product?"
        description="This action is destructive and cannot be undone."
        destructive
        confirmLabel={deleteM.isPending ? 'Deleting…' : 'Delete'}
        onOpenChange={(o) => (!o ? setConfirmDeleteId(null) : undefined)}
        onConfirm={() => confirmDeleteId && deleteM.mutate(confirmDeleteId)}
      />
    </div>
  )
}

function EditProductForm({
  product,
  categories,
  onSave,
  onCancel,
}: {
  product: Product
  categories: Array<{ categoryId: string; categoryName: string }>
  onSave: (values: FormValues) => void
  onCancel: () => void
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: product.name,
      price: product.price,
      stockQty: product.stockQty,
      categoryId: product.categoryId,
    },
  })

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSave)}>
      <div className="space-y-2">
        <Label>Name</Label>
        <Input {...form.register('name')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Price</Label>
          <Input type="number" step="0.01" {...form.register('price', { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label>Stock Qty</Label>
          <Input type="number" {...form.register('stockQty', { valueAsNumber: true })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={form.watch('categoryId')} onValueChange={(v) => form.setValue('categoryId', v, { shouldValidate: true })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.categoryId} value={c.categoryId}>
                {c.categoryName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting}>
          Save
        </Button>
      </DialogFooter>
    </form>
  )
}
