import { Link, useParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'

export default function CheckoutSuccessPage() {
  const { id } = useParams()

  return (
    <div className="space-y-6">
      <PageHeader title="Order placed" description="Thanks for your purchase." />
      <Card className="border-line-strong bg-brand-tint/60">
        <CardContent className="space-y-4 p-10 text-center">
          <div className="text-sm text-muted">
            Your order ID is <span className="font-medium text-ink-strong">{id}</span>.
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/app/orders">View orders</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/app/products">Continue shopping</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
