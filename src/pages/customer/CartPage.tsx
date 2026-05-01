import { Link, useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/utils/format'

export default function CartPage() {
  const navigate = useNavigate()
  const { items, updateQty, removeItem, subtotal, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Cart" description="Your cart is empty." />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <div className="text-sm text-muted">Browse products and add items to your cart.</div>
            <Button asChild>
              <Link to="/app/products">Browse products</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cart"
        description="Review items before checkout."
        actions={
          <Button variant="secondary" onClick={clearCart}>
            Clear cart
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 p-6">
            {items.map((i) => (
              <div key={i.productId} className="flex flex-col gap-3 rounded-xl border border-line bg-page p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate font-medium text-ink-strong">{i.product.name}</div>
                  <div className="text-sm text-muted">{formatCurrency(i.product.price)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    className="w-24"
                    type="number"
                    min={1}
                    value={i.quantity}
                    onChange={(e) => updateQty(i.productId, Math.max(1, Number(e.target.value)))}
                  />
                  <div className="w-28 text-right text-sm font-medium text-ink-strong">
                    {formatCurrency(i.product.price * i.quantity)}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(i.productId)} aria-label="Remove">
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="text-sm font-medium text-ink-strong">Summary</div>
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span className="font-medium text-ink-strong">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Estimated total</span>
              <span className="font-medium text-ink-strong">{formatCurrency(subtotal)}</span>
            </div>
            <Button className="w-full" onClick={() => navigate('/app/checkout')}>
              Checkout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
