import type { OrderStatus } from '@/types/entities'
import { Badge } from '@/components/ui/badge'

export function StatusBadge({ status }: { status: OrderStatus | 'active' | 'inactive' }) {
  if (status === 'active') return <Badge variant="success">Active</Badge>
  if (status === 'inactive') return <Badge variant="neutral">Inactive</Badge>
  switch (status) {
    case 'pending':
      return <Badge variant="warning">Pending</Badge>
    case 'processing':
      return <Badge variant="processing">Processing</Badge>
    case 'shipped':
      return <Badge variant="info">Shipped</Badge>
    case 'delivered':
      return <Badge variant="success">Delivered</Badge>
    case 'cancelled':
      return <Badge variant="destructive">Cancelled</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
