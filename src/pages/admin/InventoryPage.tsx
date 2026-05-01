import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Download, Package, ShieldAlert, TriangleAlert, CheckCircle, Box } from 'lucide-react'
import { getProducts, updateProduct } from '@/api/products.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { DataTable } from '@/components/shared/DataTable'
import { Pagination } from '@/components/shared/Pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { STOCK_THRESHOLDS } from '@/utils/constants'

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminInventoryPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const products = useQuery({
    queryKey: ['products', { page, search }],
    queryFn: () => getProducts({ page, limit: 10, search: search || undefined, sortBy: 'stockQty', order: 'asc' }),
  })

  const all = useQuery({
    queryKey: ['products', 'inventory-report'],
    queryFn: () => getProducts({ page: 1, limit: 500 }),
  })

  const restock = useMutation({
    mutationFn: ({ id, stockQty }: { id: string; stockQty: number }) => updateProduct(id, { stockQty }),
    onSuccess: async () => {
      toast.success('Restocked')
      await qc.invalidateQueries({ queryKey: ['products'] })
      await qc.invalidateQueries({ queryKey: ['analytics', 'low-stock'] })
    },
  })

  const summary = useMemo(() => {
    const rows = all.data?.data ?? []
    const out = rows.filter((p) => p.stockQty === 0).length
    const critical = rows.filter((p) => p.stockQty > 0 && p.stockQty < STOCK_THRESHOLDS.critical).length
    const low = rows.filter((p) => p.stockQty >= STOCK_THRESHOLDS.critical && p.stockQty < STOCK_THRESHOLDS.low).length
    const healthy = rows.filter((p) => p.stockQty >= STOCK_THRESHOLDS.low).length
    return { total: rows.length, out, critical, low, healthy }
  }, [all.data])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Real-time stock view with quick restock actions."
        actions={
          <Button
            variant="outline"
            onClick={() => downloadJson('inventory-report.json', all.data?.data ?? [])}
            disabled={!all.data?.data?.length}
          >
            <Download className="h-4 w-4" />
            Export report
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Package} label="Total SKUs" value={String(summary.total)} tone="green" />
        <StatCard icon={Box} label="Out of stock" value={String(summary.out)} tone="red" />
        <StatCard icon={ShieldAlert} label="Critical" value={String(summary.critical)} tone="red" />
        <StatCard icon={TriangleAlert} label="Low" value={String(summary.low)} tone="amber" />
        <StatCard icon={CheckCircle} label="Healthy" value={String(summary.healthy)} tone="blue" />
      </div>

      <div className="rounded-2xl border border-line bg-card p-4">
        <Input placeholder="Search inventory…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <DataTable
        rows={products.data?.data ?? []}
        rowId={(r) => r.productId}
        columns={[
          { key: 'id', header: 'Product', cell: (r) => <div><div className="font-medium">{r.name}</div><div className="font-mono text-xs text-muted">{r.productId}</div></div> },
          { key: 'cat', header: 'Category', cell: (r) => <span className="text-muted">{r.category?.categoryName ?? r.categoryId}</span> },
          {
            key: 'stock',
            header: 'Stock',
            cell: (r) => {
              const badge =
                r.stockQty === 0 ? <Badge variant="destructive">Out</Badge> :
                r.stockQty < STOCK_THRESHOLDS.critical ? <Badge variant="destructive">Critical</Badge> :
                r.stockQty < STOCK_THRESHOLDS.low ? <Badge variant="warning">Low</Badge> :
                <Badge variant="success">Healthy</Badge>
              return (
                <div className="min-w-[180px]">
                  <div className="mb-2 flex items-center gap-2">
                    {badge}
                    <span className="font-medium">{r.stockQty}</span>
                  </div>
                  <div className="h-[5px] overflow-hidden rounded-full bg-brand-soft">
                    <div
                      className={
                        r.stockQty === 0
                          ? 'h-full bg-red-soft'
                          : r.stockQty < STOCK_THRESHOLDS.low
                            ? 'h-full bg-amber-soft'
                            : 'h-full bg-brand'
                      }
                      style={{ width: `${Math.max(8, Math.min(100, (r.stockQty / 80) * 100))}%` }}
                    />
                  </div>
                </div>
              )
            },
          },
          {
            key: 'restock',
            header: 'Quick restock',
            cell: (r) => (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => restock.mutate({ id: r.productId, stockQty: r.stockQty + 25 })}>
                  +25
                </Button>
                <Button variant="outline" size="sm" onClick={() => restock.mutate({ id: r.productId, stockQty: 50 })}>
                  Set 50
                </Button>
              </div>
            ),
          },
        ]}
        empty={<div className="text-sm text-muted">No products.</div>}
      />

      <Pagination page={products.data?.page ?? page} totalPages={products.data?.totalPages ?? 1} onPageChange={setPage} />
    </div>
  )
}
