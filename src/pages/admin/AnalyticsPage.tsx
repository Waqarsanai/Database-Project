import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ShoppingCart, BarChart2 } from 'lucide-react'
import {
  getSalesAnalytics, getTopProducts, getDemandForecast,
  getMarketBasket, getCategoryPerformance, getLowStockForecast,
} from '@/api/analytics.api'
import { getProducts } from '@/api/products.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { ChartCard } from '@/components/charts/ChartCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/shared/DataTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'

/* ─── Colors ─────────────────────────────────────────────────────────────── */
const PIE_COLORS = [
  'var(--chart-primary)',
  'var(--chart-secondary)',
  'var(--chart-tertiary)',
  'var(--color-amber-soft)',
  'var(--color-brand-hover)',
]

/* ─── Custom tooltips ────────────────────────────────────────────────────── */
function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2.5 shadow-lg text-xs space-y-1">
      <div className="font-medium text-ink-strong">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.dataKey === 'revenue' ? 'var(--chart-primary)' : 'var(--chart-secondary)' }} />
          <span className="text-muted capitalize">{p.dataKey}:</span>
          <span className="font-semibold text-ink-strong">
            {p.dataKey === 'revenue' ? formatCurrency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function ForecastTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2.5 shadow-lg text-xs space-y-1">
      <div className="font-medium text-ink-strong">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 capitalize">
          <span className="text-muted">{p.dataKey}:</span>
          <span className="font-semibold text-ink-strong">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2 shadow-lg text-xs">
      <div className="text-muted mb-1">{payload[0]?.name}</div>
      <div className="font-semibold text-ink-strong">{formatCurrency(payload[0]?.value ?? 0)}</div>
    </div>
  )
}

/* ─── KPI card ───────────────────────────────────────────────────────────── */
function KpiCard({
  label, value, sub, trend, icon: Icon,
}: {
  label: string
  value: string
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ElementType
}) {
  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className={cn('absolute inset-x-0 top-0 h-[3px]',
        trend === 'up' ? 'bg-brand' : trend === 'down' ? 'bg-red' : 'bg-subtle'
      )} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-subtle">{label}</div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-ink-strong">{value}</div>
            {sub && (
              <div className={cn('mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                trend === 'up'   ? 'bg-brand-tint text-brand-hover' :
                trend === 'down' ? 'bg-red-tint text-red' :
                'bg-page text-muted'
              )}>
                {trend === 'up'   && <TrendingUp className="h-3 w-3" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3" />}
                {trend === 'neutral' && <Minus className="h-3 w-3" />}
                {sub}
              </div>
            )}
          </div>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-tint text-brand-hover">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Days remaining badge ───────────────────────────────────────────────── */
function DaysBadge({ days }: { days: number }) {
  const tone = days <= 3 ? 'bg-red-tint text-red' : days <= 7 ? 'bg-amber-tint text-amber' : 'bg-brand-tint text-brand-hover'
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', tone)}>
      {days}d
    </span>
  )
}

/* ─── Confidence bar ─────────────────────────────────────────────────────── */
function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-page">
        <div className="h-full rounded-full bg-brand" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-muted">{value}%</span>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day')
  const [productId, setProductId] = useState<string>('')

  const sales        = useQuery({ queryKey: ['analytics', 'sales', { period }],                queryFn: () => getSalesAnalytics({ period }) })
  const top          = useQuery({ queryKey: ['analytics', 'top-products', { period }],          queryFn: () => getTopProducts({ period }) })
  const categories   = useQuery({ queryKey: ['analytics', 'category-performance', { period }],  queryFn: () => getCategoryPerformance({ period }) })
  const products     = useQuery({ queryKey: ['products', { page: 1, limit: 50 }],               queryFn: () => getProducts({ page: 1, limit: 50 }) })
  const basket       = useQuery({ queryKey: ['analytics', 'market-basket', { period }],         queryFn: () => getMarketBasket({ period }) })
  const lowStockFc   = useQuery({ queryKey: ['analytics', 'low-stock-forecast', { period }],    queryFn: () => getLowStockForecast({ period }) })

  const selectedProductId = productId || products.data?.data?.[0]?.productId || ''
  const forecast = useQuery({
    queryKey: ['analytics', 'demand-forecast', { productId: selectedProductId, period }],
    queryFn: () => getDemandForecast(selectedProductId, { period }),
    enabled: Boolean(selectedProductId),
  })

  const totals = useMemo(() => {
    const s = sales.data ?? []
    const revenue = s.reduce((sum, p) => sum + p.revenue, 0)
    const ordersCount = s.reduce((sum, p) => sum + p.orders, 0)
    const aov = ordersCount ? revenue / ordersCount : 0
    return { revenue, orders: ordersCount, aov }
  }, [sales.data])

  // week-over-week comparison
  const wow = useMemo(() => {
    const s = sales.data ?? []
    if (s.length < 14) return null
    const half = Math.floor(s.length / 2)
    const recent = s.slice(-half).reduce((sum, p) => sum + p.revenue, 0)
    const prior  = s.slice(-half * 2, -half).reduce((sum, p) => sum + p.revenue, 0)
    if (!prior) return null
    return ((recent - prior) / prior) * 100
  }, [sales.data])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Sales intelligence, demand forecasting, and recommendations."
        actions={
          <Select value={period} onValueChange={(v) => setPeriod(v as 'day' | 'week' | 'month')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* ── KPI row ──────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          icon={TrendingUp}
          label="Total revenue"
          value={formatCurrency(totals.revenue)}
          sub={wow != null ? `${wow >= 0 ? '+' : ''}${wow.toFixed(1)}% vs prior period` : undefined}
          trend={wow == null ? 'neutral' : wow >= 0 ? 'up' : 'down'}
        />
        <KpiCard
          icon={ShoppingCart}
          label="Total orders"
          value={String(totals.orders)}
          sub="All periods combined"
          trend="neutral"
        />
        <KpiCard
          icon={BarChart2}
          label="Avg order value"
          value={formatCurrency(totals.aov)}
          sub="Revenue ÷ orders"
          trend={totals.aov > 0 ? 'up' : 'neutral'}
        />
      </div>

      {/* ── Sales overview + top products ────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Sales overview" subtitle="Revenue & order volume" loading={sales.isLoading} height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sales.data ?? []} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
              <defs>
                <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--chart-primary)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--chart-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis yAxisId="rev" tick={{ fontSize: 10, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} width={44} />
              <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 10, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<RevenueTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="var(--chart-primary)" strokeWidth={2} fill="url(#revArea)" dot={false} activeDot={{ r: 4 }} />
              <Line  yAxisId="ord" type="monotone" dataKey="orders"  stroke="var(--chart-secondary)" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top products" subtitle="By units sold this period" loading={top.isLoading} height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top.data ?? []} layout="vertical" margin={{ left: 4, right: 24, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-line)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
              <YAxis
                type="category" dataKey="name" width={90}
                tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
                axisLine={false} tickLine={false}
                tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 11) + '…' : v}
              />
              <Tooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="rounded-xl border border-line bg-card px-3 py-2 shadow-lg text-xs">
                    <div className="font-medium text-ink-strong mb-1">{label}</div>
                    <div className="text-muted">Units: <span className="font-semibold text-ink-strong">{payload[0]?.value}</span></div>
                    <div className="text-muted">Revenue: <span className="font-semibold text-ink-strong">{formatCurrency((payload[1]?.value as number) ?? 0)}</span></div>
                  </div>
                )
              }} cursor={{ fill: 'var(--color-brand-tint)' }} />
              <Bar dataKey="quantity" radius={[0, 6, 6, 0]} maxBarSize={16} fill="var(--chart-primary)" />
              <Bar dataKey="revenue"  radius={[0, 6, 6, 0]} maxBarSize={16} fill="var(--chart-secondary)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Forecast + category + low stock ──────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Demand forecast"
          subtitle="Next 30 days — upper/lower bounds"
          loading={forecast.isLoading}
          height={300}
          right={
            <Select value={selectedProductId} onValueChange={(v) => setProductId(v)}>
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(products.data?.data ?? []).map((p) => (
                  <SelectItem key={p.productId} value={p.productId} className="text-xs">{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast.data ?? []} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
              <defs>
                <linearGradient id="upperGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--chart-secondary)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--chart-secondary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--chart-primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--chart-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
              <XAxis dataKey="date" hide />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<ForecastTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Area type="monotone" dataKey="upper"  stroke="var(--chart-secondary)" strokeWidth={1.5} fill="url(#upperGrad)"  strokeDasharray="4 2" dot={false} />
              <Area type="monotone" dataKey="demand" stroke="var(--chart-primary)"   strokeWidth={2}   fill="url(#demandGrad)" dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="lower"  stroke="var(--chart-tertiary)"  strokeWidth={1.5} fill="transparent"       strokeDasharray="4 2" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Category performance" subtitle="Revenue share by category" loading={categories.isLoading} height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<PieTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Pie
                data={categories.data ?? []}
                dataKey="revenue"
                nameKey="categoryName"
                cx="50%" cy="44%"
                innerRadius={50} outerRadius={80}
                paddingAngle={3}
              >
                {(categories.data ?? []).map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Low stock forecast table */}
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center gap-2 border-b border-line bg-page px-5 py-3.5">
            <AlertTriangle className="h-4 w-4 text-amber" />
            <div>
              <CardTitle className="text-sm">Low stock forecast</CardTitle>
              <div className="text-[11px] text-muted">Days of stock remaining</div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              rows={lowStockFc.data ?? []}
              rowId={(r) => r.productId}
              columns={[
                { key: 'p',        header: 'Product',   cell: (r) => <span className="text-xs font-medium text-ink-strong">{r.name}</span> },
                { key: 'stock',    header: 'Stock',     cell: (r) => <span className="text-xs text-muted">{r.stockQty}</span> },
                { key: 'velocity', header: 'Avg/day',   cell: (r) => <span className="text-xs text-muted">{r.avgDailySales}</span> },
                { key: 'days',     header: 'Days left', cell: (r) => <DaysBadge days={r.daysRemaining} /> },
              ]}
              empty={<div className="p-4 text-sm text-muted">No forecast rows.</div>}
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Market basket ────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center gap-2 border-b border-line bg-page px-5 py-3.5">
          <ShoppingCart className="h-4 w-4 text-brand-hover" />
          <div>
            <CardTitle className="text-sm">Market basket — bundle recommendations</CardTitle>
            <div className="text-[11px] text-muted">Products frequently purchased together</div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            rows={basket.data ?? []}
            rowId={(r) => `${r.productAId}-${r.productBId}`}
            columns={[
              { key: 'a', header: 'Product A',    cell: (r) => <span className="text-xs font-medium text-ink-strong">{r.productAName}</span> },
              { key: 'b', header: 'Product B',    cell: (r) => <span className="text-xs font-medium text-ink-strong">{r.productBName}</span> },
              { key: 's', header: 'Support %',    cell: (r) => <ConfidenceBar value={r.supportPct} /> },
              { key: 'c', header: 'Confidence %', cell: (r) => <ConfidenceBar value={r.confidencePct} /> },
            ]}
            empty={<div className="p-4 text-sm text-muted">No pairs found.</div>}
          />
        </CardContent>
      </Card>
    </div>
  )
}