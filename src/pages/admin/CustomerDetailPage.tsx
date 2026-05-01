import { Link, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCustomerById } from '@/api/customers.api'
import { getOrders } from '@/api/orders.api'
import { getRecommendations } from '@/api/analytics.api'
import { getProducts } from '@/api/products.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/DataTable'
import { RecommendationCarousel } from '@/components/shared/RecommendationCarousel'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { StatusBadge } from '@/components/shared/StatusBadge'

export default function AdminCustomerDetailPage() {
  const { id } = useParams()

  const customer = useQuery({
    queryKey: ['customers', id],
    queryFn: () => getCustomerById(id!),
    enabled: Boolean(id),
  })

  const orders = useQuery({
    queryKey: ['orders', { customerId: id, page: 1, limit: 50 }],
    queryFn: () => getOrders({ customerId: id!, page: 1, limit: 50, sortBy: 'datetime', order: 'desc' }),
    enabled: Boolean(id),
  })

  const spent = useMemo(
    () =>
      (orders.data?.data ?? []).reduce(
        (sum, o) => sum + (o.items ?? []).reduce((s, i) => s + (i.product?.price ?? 0) * i.quantity, 0),
        0,
      ),
    [orders.data],
  )

  const recIds = useQuery({
    queryKey: ['analytics', 'recommendations', { customerId: id }],
    queryFn: () => getRecommendations({ customerId: id! }),
    enabled: Boolean(id),
  })

  const recProducts = useQuery({
    queryKey: ['products', 'recommended', recIds.data?.productIds],
    queryFn: async () => {
      const res = await getProducts({ page: 1, limit: 10 })
      return res.data
    },
    enabled: Boolean(recIds.data?.productIds?.length),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.data ? `${customer.data.firstName} ${customer.data.lastName}` : 'Customer'}
        description={customer.data ? customer.data.email : undefined}
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/customers">Back</Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="border-b border-line bg-page">
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="mb-3 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-tint text-[11px] font-semibold text-blue">
                {customer.data?.firstName?.[0]}
                {customer.data?.lastName?.[0]}
              </span>
              <div>
                <div className="font-medium text-ink-strong">{customer.data?.firstName} {customer.data?.lastName}</div>
                <div className="text-xs text-subtle">{customer.data?.email}</div>
              </div>
            </div>
            <div className="text-muted">
              <span className="font-medium text-ink-strong">CustomerID:</span> {customer.data?.customerId}
            </div>
            <div className="text-muted">
              <span className="font-medium text-ink-strong">Phone:</span> {customer.data?.phone}
            </div>
            <div className="text-muted">
              <span className="font-medium text-ink-strong">Address:</span> {customer.data?.address}
            </div>
            <div className="text-muted">
              <span className="font-medium text-ink-strong">Joined:</span> {customer.data?.createdAt ? formatDateTime(customer.data.createdAt) : '—'}
            </div>
            <div className="pt-2 text-muted">
              <span className="font-medium text-ink-strong">Total spent:</span> {formatCurrency(spent)}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-line bg-page">
            <CardTitle>Order history</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rows={orders.data?.data ?? []}
              rowId={(r) => r.orderId}
              columns={[
                { key: 'id', header: 'Order', cell: (r) => <Link className="font-medium hover:underline" to={`/admin/orders/${r.orderId}`}>{r.orderId}</Link> },
                { key: 'date', header: 'Date', cell: (r) => <span className="text-muted">{formatDateTime(r.datetime)}</span> },
                { key: 'items', header: 'Items', cell: (r) => <span className="text-muted">{(r.items ?? []).length}</span> },
                { key: 'total', header: 'Total', cell: (r) => <span className="font-medium">{formatCurrency((r.items ?? []).reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0))}</span> },
                { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
              ]}
              empty={<div className="text-sm text-muted">No orders found.</div>}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-line bg-page">
          <CardTitle>Recommended products</CardTitle>
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
  )
}
