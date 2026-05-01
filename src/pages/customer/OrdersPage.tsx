import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getOrders } from '@/api/orders.api'
import { authStore } from '@/store/authStore'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Pagination } from '@/components/shared/Pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { OrderStatus } from '@/types/entities'

export default function CustomerOrdersPage() {
  const user = authStore((s) => s.user)
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [page, setPage] = useState(1)

  const orders = useQuery({
    queryKey: ['orders', { customerId: user?.id, status, page }],
    queryFn: () =>
      getOrders({
        customerId: user!.id,
        page,
        limit: 10,
        status: status === 'all' ? undefined : status,
        sortBy: 'datetime',
        order: 'desc',
      }),
    enabled: Boolean(user?.id),
  })

  const rows = orders.data?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="My orders"
        description="Track purchases and delivery status."
        actions={
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as OrderStatus | 'all')
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Status" />
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
        }
      />

      <DataTable
        rows={rows}
        rowId={(r) => r.orderId}
        columns={[
          { key: 'id', header: 'Order', cell: (r) => <Link className="font-medium hover:underline" to={`/app/orders/${r.orderId}`}>{r.orderId}</Link> },
          { key: 'date', header: 'Date', cell: (r) => <span className="text-muted">{formatDateTime(r.datetime)}</span> },
          { key: 'items', header: 'Items', cell: (r) => <span className="text-muted">{(r.items ?? []).length}</span> },
          { key: 'total', header: 'Total', cell: (r) => <span className="font-medium">{formatCurrency((r.items ?? []).reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0))}</span> },
          { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
        ]}
        empty={<div className="text-sm text-muted">No orders found.</div>}
      />

      <Pagination page={orders.data?.page ?? page} totalPages={orders.data?.totalPages ?? 1} onPageChange={setPage} />
    </div>
  )
}
