import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getOrderById } from '@/api/orders.api'
import { cartStore } from '@/store/cartStore'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDateTime } from '@/utils/format'

export default function CustomerOrderDetailPage() {
  const { id } = useParams()
  const addItem = cartStore((s) => s.addItem)

  const order = useQuery({
    queryKey: ['orders', id],
    queryFn: () => getOrderById(id!),
    enabled: Boolean(id),
  })

  const total = useMemo(
    () => (order.data?.items ?? []).reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0),
    [order.data],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.data?.orderId ?? 'Order'}
        description={order.data?.datetime ? `Placed: ${formatDateTime(order.data.datetime)}` : undefined}
        actions={
          <Button asChild variant="outline">
            <Link to="/app/orders">Back</Link>
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
                  <div className="shrink-0 font-medium text-ink-strong">
                    {formatCurrency((i.product?.price ?? 0) * i.quantity)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Total</span>
                <span className="font-semibold text-ink-strong">{formatCurrency(total)}</span>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  ;(order.data.items ?? []).forEach((it) => {
                    if (it.product) addItem(it.product, it.quantity)
                  })
                  toast.success('Added items to cart')
                }}
              >
                Reorder
              </Button>
              <Button asChild variant="secondary" className="w-full">
                <Link to="/app/cart">Go to cart</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-card p-6 text-sm text-muted">Loading…</div>
      )}
    </div>
  )
}
