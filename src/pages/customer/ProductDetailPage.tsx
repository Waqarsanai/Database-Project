import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getProductById, getProducts } from '@/api/products.api'
import { getRecommendations } from '@/api/analytics.api'
import { cartStore } from '@/store/cartStore'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { RecommendationCarousel } from '@/components/shared/RecommendationCarousel'
import { formatCurrency } from '@/utils/format'
import { STOCK_THRESHOLDS } from '@/utils/constants'

export default function CustomerProductDetailPage() {
  const { id } = useParams()
  const addItem = cartStore((s) => s.addItem)
  const [qty, setQty] = useState(1)

  const product = useQuery({
    queryKey: ['products', id],
    queryFn: () => getProductById(id!),
    enabled: Boolean(id),
  })

  const recIds = useQuery({
    queryKey: ['analytics', 'fbt', id],
    queryFn: () => getRecommendations({ productId: id! }),
    enabled: Boolean(id),
  })

  const recProducts = useQuery({
    queryKey: ['products', 'fbt-products', recIds.data?.productIds],
    queryFn: async () => {
      const res = await getProducts({ page: 1, limit: 10 })
      return res.data
    },
    enabled: Boolean(recIds.data?.productIds?.length),
  })

  const p = product.data
  const out = p ? p.stockQty === 0 : false
  const low = p ? p.stockQty > 0 && p.stockQty < STOCK_THRESHOLDS.low : false

  const maxQty = useMemo(() => (p ? Math.max(1, Math.min(25, p.stockQty || 1)) : 1), [p])

  return (
    <div className="space-y-6">
      <PageHeader
        title={p?.name ?? 'Product'}
        description={p?.category?.categoryName ? `Category: ${p.category.categoryName}` : undefined}
        actions={
          <Button asChild variant="outline">
            <Link to="/app/products">Back</Link>
          </Button>
        }
      />

      {p ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="space-y-4 p-6">
              <div className="flex h-64 items-center justify-center rounded-2xl border border-line bg-brand-soft">
                <div className="rounded-2xl bg-card px-6 py-4 text-sm font-semibold text-brand-hover shadow-sm">Product preview</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {out ? <Badge variant="destructive">Out of stock</Badge> : low ? <Badge variant="warning">Low stock</Badge> : <Badge variant="success">In stock</Badge>}
                {p.category?.categoryName ? <Badge variant="outline">{p.category.categoryName}</Badge> : null}
              </div>
              <div className="text-2xl font-semibold text-ink-strong">{formatCurrency(p.price)}</div>
              <div className="text-sm text-muted">Stock Qty: {p.stockQty}</div>
              <div className="text-sm text-muted">
                Description: <span className="text-subtle">Backend will provide product descriptions.</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="text-sm font-medium text-ink-strong">Add to cart</div>
              <div className="space-y-2">
                <div className="text-sm text-muted">Quantity</div>
                <Input
                  type="number"
                  min={1}
                  max={maxQty}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value))))}
                />
                <div className="text-xs text-subtle">Max: {maxQty}</div>
              </div>
              <Button
                className="w-full"
                disabled={out}
                onClick={() => {
                  addItem(p, qty)
                  toast.success('Added to cart')
                }}
              >
                Add to Cart
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

      <section className="space-y-3">
        <div className="text-lg font-semibold text-ink-strong">Frequently bought together</div>
        {recProducts.data?.length ? (
          <RecommendationCarousel products={recProducts.data} />
        ) : (
          <div className="rounded-xl border border-line bg-card p-6 text-sm text-muted">Loading suggestions…</div>
        )}
      </section>
    </div>
  )
}
