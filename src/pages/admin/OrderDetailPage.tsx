import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getOrderById, patchOrderStatus, updateOrder } from '@/api/orders.api'
import { getAdmins } from '@/api/admins.api'
import type { OrderStatus } from '@/types/entities'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { getErrorMessage } from '@/utils/errors'

export default function AdminOrderDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()

  const order = useQuery({
    queryKey: ['orders', id],
    queryFn: () => getOrderById(id!),
    enabled: Boolean(id),
  })

  const admins = useQuery({
    queryKey: ['admins', { page: 1, limit: 50 }],
    queryFn: () => getAdmins({ page: 1, limit: 50 }),
  })

  const setStatus = useMutation({
    mutationFn: (status: OrderStatus) => patchOrderStatus(id!, status),
    onSuccess: async () => {
      toast.success('Status updated')
      await qc.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Update failed')),
  })

  const assignAdmin = useMutation({
    mutationFn: (adminId: string) => updateOrder(id!, { processedBy: adminId }),
    onSuccess: async () => {
      toast.success('Assigned')
      await qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  const total = (order.data?.items ?? []).reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.data?.orderId ?? 'Order'}
        description={order.data?.datetime ? `Placed: ${formatDateTime(order.data.datetime)}` : undefined}
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/orders">Back</Link>
          </Button>
        }
      />

      {order.data ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Items</CardTitle>
              <StatusBadge status={order.data.status} />
            </CardHeader>
            <CardContent className="space-y-3">
              {(order.data.items ?? []).map((i) => (
                <div key={`${i.orderId}-${i.productId}`} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-page p-4">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-ink-strong">{i.product?.name ?? i.productId}</div>
                    <div className="text-sm text-muted">
                      Qty: {i.quantity} · {formatCurrency(i.product?.price ?? 0)}
                    </div>
                  </div>
                  <div className="shrink-0 font-medium text-ink-strong">{formatCurrency((i.product?.price ?? 0) * i.quantity)}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-ink-strong">Update status</div>
                  <Select value={order.data.status} onValueChange={(v) => setStatus.mutate(v as OrderStatus)}>
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <div className="text-sm font-medium text-ink-strong">Assign admin</div>
                  <Select
                    value={order.data.processedBy ?? ''}
                    onValueChange={(v) => assignAdmin.mutate(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select admin" />
                    </SelectTrigger>
                    <SelectContent>
                      {(admins.data?.data ?? []).map((a) => (
                        <SelectItem key={a.adminId} value={a.adminId}>
                          {a.firstName} {a.lastName} · {a.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between border-t border-line pt-3 text-sm">
                  <span className="text-muted">Order total</span>
                  <span className="font-semibold text-ink-strong">{formatCurrency(total)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted">
                Status history is stubbed in frontend; backend can provide an events table for a full timeline.
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-card p-6 text-sm text-muted">Loading…</div>
      )}
    </div>
  )
}
