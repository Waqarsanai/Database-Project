import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { getOrders, patchOrderStatus } from '@/api/orders.api'
import type { OrderStatus } from '@/types/entities'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Pagination } from '@/components/shared/Pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { useDebounce } from '@/hooks/useDebounce'
import { getErrorMessage } from '@/utils/errors'

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))))
  const esc = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`
  const lines = [
    keys.join(','),
    ...rows.map((r) => keys.map((k) => esc(r[k])).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminOrdersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 250)
  const [selected, setSelected] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>('processing')

  const orders = useQuery({
    queryKey: ['orders', { page, status, search: debounced }],
    queryFn: () =>
      getOrders({
        page,
        limit: 10,
        status: status === 'all' ? undefined : status,
        search: debounced || undefined,
        sortBy: 'datetime',
        order: 'desc',
      }),
  })

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => patchOrderStatus(id, status),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Status updated')
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Update failed')),
  })

  const bulk = useMutation({
    mutationFn: async () => {
      await Promise.all(selected.map((id) => patchOrderStatus(id, bulkStatus)))
    },
    onSuccess: async () => {
      toast.success('Bulk status updated')
      setSelected([])
      await qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  const rows = orders.data?.data ?? []

  const exportRows = rows.map((o) => ({
    orderId: o.orderId,
    customer: o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : o.customerId,
    itemsCount: (o.items ?? []).length,
    total: (o.items ?? []).reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0),
    status: o.status,
    datetime: o.datetime,
    processedBy: o.processedBy ?? '',
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Track fulfillment and update order status."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {selected.length ? (
              <>
                <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as OrderStatus)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => bulk.mutate()} disabled={bulk.isPending}>
                  {bulk.isPending ? 'Updating…' : `Update ${selected.length}`}
                </Button>
              </>
            ) : null}
            <Button
              variant="outline"
              onClick={() => downloadCsv(`orders-page-${page}.csv`, exportRows)}
              disabled={!rows.length}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 rounded-2xl border border-line bg-card p-4 md:grid-cols-4">
        <Input
          className="md:col-span-2"
          placeholder="Search orders (id/customer)…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as OrderStatus | 'all')
            setPage(1)
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted">
          Total: <span className="font-medium text-ink-strong">{orders.data?.total ?? '—'}</span>
        </div>
      </div>

      <DataTable
        rows={rows}
        rowId={(r) => r.orderId}
        selectable
        onSelectionChange={setSelected}
        columns={[
          { key: 'id', header: 'Order', cell: (r) => <Link className="font-medium hover:underline" to={`/admin/orders/${r.orderId}`}>{r.orderId}</Link> },
          { key: 'customer', header: 'Customer', cell: (r) => <span className="text-muted">{r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : r.customerId}</span> },
          { key: 'items', header: 'Products', cell: (r) => <span className="text-muted">{(r.items ?? []).length}</span> },
          { key: 'total', header: 'Total', cell: (r) => <span className="font-medium">{formatCurrency((r.items ?? []).reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0))}</span> },
          { key: 'date', header: 'Date', cell: (r) => <span className="text-muted">{formatDateTime(r.datetime)}</span> },
          {
            key: 'status',
            header: 'Status',
            cell: (r) => (
              <div className="flex items-center gap-2">
                <StatusBadge status={r.status} />
                <Select value={r.status} onValueChange={(v) => update.mutate({ id: r.orderId, status: v as OrderStatus })}>
                  <SelectTrigger className="h-8 w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ),
          },
        ]}
        empty={<div className="text-sm text-muted">No orders found.</div>}
      />

      <Pagination page={orders.data?.page ?? page} totalPages={orders.data?.totalPages ?? 1} onPageChange={setPage} />
    </div>
  )
}
