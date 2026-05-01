import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/utils/cn'

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'green',
  trend,
  trendLabel,
  className,
}: {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
  tone?: 'green' | 'blue' | 'amber' | 'red' | 'purple'
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  className?: string
}) {
  const toneStyles = {
    green:  { icon: 'bg-brand-tint text-brand-hover',   bar: 'bg-brand',   glow: 'shadow-brand/10' },
    blue:   { icon: 'bg-blue-tint text-blue',            bar: 'bg-blue',    glow: 'shadow-blue/10' },
    amber:  { icon: 'bg-amber-tint text-amber',          bar: 'bg-amber',   glow: 'shadow-amber/10' },
    red:    { icon: 'bg-red-tint text-red',              bar: 'bg-red',     glow: 'shadow-red/10' },
    purple: { icon: 'bg-purple-tint text-purple',        bar: 'bg-purple',  glow: 'shadow-purple/10' },
  } as const

  const t = toneStyles[tone]

  return (
    <Card className={cn('relative overflow-hidden border border-line bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md', t.glow, className)}>
      {/* coloured top bar */}
      <div className={cn('absolute inset-x-0 top-0 h-[3px]', t.bar)} />
      <CardContent className="p-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-subtle truncate">{label}</div>
            <div className="mt-2 text-[22px] font-bold tracking-tight text-ink-strong leading-none">{value}</div>
            {hint && <div className="mt-1.5 text-[11px] text-muted leading-relaxed">{hint}</div>}
            {trendLabel && (
              <div className={cn('mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                trend === 'up'   ? 'bg-brand-tint text-brand-hover' :
                trend === 'down' ? 'bg-red-tint text-red' :
                'bg-page text-muted'
              )}>
                {trend === 'up'   && <TrendingUp className="h-3 w-3" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3" />}
                {trendLabel}
              </div>
            )}
          </div>
          <div className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', t.icon)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}