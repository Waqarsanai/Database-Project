import { Link } from 'react-router-dom'
import { Package2 } from 'lucide-react'
import type { Product } from '@/types/entities'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/utils/format'
import { STOCK_THRESHOLDS } from '@/utils/constants'
import { cartStore } from '@/store/cartStore'
import { toast } from 'sonner'

export function ProductCard({ product }: { product: Product }) {
  const addItem = cartStore((s) => s.addItem)
  const out = product.stockQty === 0
  const low = product.stockQty > 0 && product.stockQty < STOCK_THRESHOLDS.low

  return (
    <Card className="group overflow-hidden">
      <CardHeader className="gap-3">
        <div className="flex h-36 items-center justify-center rounded-xl border border-line bg-brand-soft">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-sm">
            <Package2 className="h-6 w-6 text-brand-hover" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {out ? <Badge variant="destructive">Out of stock</Badge> : low ? <Badge variant="warning">Low stock</Badge> : <Badge variant="success">In stock</Badge>}
          {product.category?.categoryName ? <Badge variant="outline">{product.category.categoryName}</Badge> : null}
        </div>
        <CardTitle className="line-clamp-1 text-[13px]">
          <Link to={`/app/products/${product.productId}`} className="hover:underline">
            {product.name}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-subtle">Category</div>
        <div className="mt-1 text-sm text-muted">{product.category?.categoryName ?? 'General goods'}</div>
        <div className="mt-4 text-[15px] font-semibold text-ink-deep">{formatCurrency(product.price)}</div>
        <div className="mt-1 text-sm text-muted">Stock: {product.stockQty}</div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          className="w-full transition-all group-hover:-translate-y-0 group-hover:opacity-100 md:translate-y-1 md:opacity-90"
          disabled={out}
          onClick={() => {
            addItem(product, 1)
            toast.success('Added to cart')
          }}
        >
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  )
}
