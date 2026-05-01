import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ChartCard({
  title,
  subtitle,
  loading,
  children,
  right,
  height = 280,
}: {
  title: string
  subtitle?: string
  loading?: boolean
  right?: React.ReactNode
  children: React.ReactNode
  height?: number
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between gap-3 border-b border-line bg-page px-5 py-3.5">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink-strong truncate">{title}</div>
          {subtitle && <div className="mt-0.5 text-[11px] text-muted">{subtitle}</div>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </CardHeader>
      <CardContent className="p-4" style={{ height }}>
        {loading ? (
          <div className="flex h-full flex-col gap-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="flex-1 w-full" />
          </div>
        ) : children}
      </CardContent>
    </Card>
  )
}