import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getOrders } from '@/api/orders.api'
import { getRecommendations } from '@/api/analytics.api'
import { getProducts } from '@/api/products.api'
import { authStore } from '@/store/authStore'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RecommendationCarousel } from '@/components/shared/RecommendationCarousel'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDateTime } from '@/utils/format'

export default function CustomerDashboardPage() {
  const user = authStore((s) => s.user)

  const recentOrders = useQuery({
    queryKey: ['orders', { customerId: user?.id, page: 1, limit: 5 }],
    queryFn: () => getOrders({ customerId: user!.id, page: 1, limit: 5, sortBy: 'datetime', order: 'desc' }),
    enabled: Boolean(user?.id),
  })

  const recIds = useQuery({
    queryKey: ['analytics', 'recommendations', { customerId: user?.id }],
    queryFn: () => getRecommendations({ customerId: user!.id }),
    enabled: Boolean(user?.id),
  })

  const recProducts = useQuery({
    queryKey: ['products', 'recommended', recIds.data?.productIds],
    queryFn: async () => {
      const first = recIds.data?.productIds?.[0]
      if (!first) return []
      const res = await getProducts({ page: 1, limit: 10, sortBy: 'stockQty', order: 'desc' })
      // mock-friendly: just return the first page; backend can switch to dedicated endpoint later
      return res.data
    },
    enabled: Boolean(recIds.data?.productIds?.length),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome${user?.firstName ? `, ${user.firstName}` : ''}`}
        description="Your personalized dashboard."
        actions={
          <Button asChild variant="secondary">
            <Link to="/app/products">Browse products</Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent orders</CardTitle>
            <Button asChild variant="ghost">
              <Link to="/app/orders">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.data?.data?.length ? (
              <div className="space-y-3">
                {recentOrders.data.data.map((o) => (
                  <Link
                    key={o.orderId}
                    to={`/app/orders/${o.orderId}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line bg-page p-3 hover:border-line-strong"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink-strong">{o.orderId}</div>
                      <div className="text-xs text-muted">{formatDateTime(o.datetime)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden text-sm text-muted sm:block">
                        {formatCurrency(
                          (o.items ?? []).reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0),
                        )}
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted">No orders yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended for you</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {recProducts.data?.length ? (
              <RecommendationCarousel products={recProducts.data} />
            ) : (
              <div className="text-sm text-muted">Loading recommendations…</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
