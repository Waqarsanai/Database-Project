import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts'
import { Boxes, DollarSign, Package, ShoppingBag, TriangleAlert, Users, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getProducts } from '@/api/products.api'
import { getOrders, patchOrderStatus } from '@/api/orders.api'
import { getCustomers } from '@/api/customers.api'
import { getLowStock, getSalesAnalytics, getTopProducts, getCategoryPerformance } from '@/api/analytics.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChartCard } from '@/components/charts/ChartCard'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { OrderStatus } from '@/types/entities'

/* ─── Custom tooltip ─────────────────────────────────────────────────────── */
function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2 shadow-lg text-xs">
      <div className="text-muted mb-1">{label}</div>
      <div className="font-semibold text-ink-strong">{formatCurrency(payload[0]?.value ?? 0)}</div>
    </div>
  )
}

function CountTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2 shadow-lg text-xs">
      <div className="text-muted mb-1">{label}</div>
      <div className="font-semibold text-ink-strong">{payload[0]?.value} units</div>
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

const PIE_COLORS = [
  'var(--chart-primary)',
  'var(--chart-secondary)',
  'var(--chart-tertiary)',
  'var(--color-amber-soft)',
  'var(--color-brand-hover)',
]

/* ─── Custom pie label ───────────────────────────────────────────────────── */
function renderPieLabel({ cx, cy, midAngle, outerRadius, name }: {
  cx: number; cy: number; midAngle: number; outerRadius: number; name: string
}) {
  const RADIAN = Math.PI / 180
  const r = outerRadius + 22
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="fill-muted text-[10px]" fontSize={10}>
      {name.length > 12 ? name.slice(0, 11) + '…' : name}
    </text>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function AdminDashboardPage() {
  const qc = useQueryClient()

  const products  = useQuery({ queryKey: ['products',   { page: 1, limit: 1 }], queryFn: () => getProducts({ page: 1, limit: 1 }) })
  const orders    = useQuery({ queryKey: ['orders',     { page: 1, limit: 10 }], queryFn: () => getOrders({ page: 1, limit: 10, sortBy: 'datetime', order: 'desc' }) })
  const customers = useQuery({ queryKey: ['customers',  { page: 1, limit: 1 }], queryFn: () => getCustomers({ page: 1, limit: 1 }) })
  const lowStock  = useQuery({ queryKey: ['analytics',  'low-stock'], queryFn: () => getLowStock({}) })
  const topProducts = useQuery({ queryKey: ['analytics', 'top-products'], queryFn: () => getTopProducts({}) })
  const sales     = useQuery({ queryKey: ['analytics',  'sales'], queryFn: () => getSalesAnalytics({}) })
  const categoryPerf = useQuery({ queryKey: ['analytics', 'category-performance'], queryFn: () => getCategoryPerformance({}) })

  const revenueThisMonth = useMemo(() => {
    const now = new Date()
    const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return (sales.data ?? [])
      .filter((p) => p.date.startsWith(m))
      .reduce((sum, p) => sum + p.revenue, 0)
  }, [sales.data])

  // sparkline: last 7 revenue points
  const revenueSparkline = useMemo(() => (sales.data ?? []).slice(-7), [sales.data])

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) => patchOrderStatus(orderId, status),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['orders'] }) },
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Admin dashboard" description="Operational overview and live alerts." />

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={Package}
          label="Total Products"
          value={String(products.data?.total ?? '—')}
          tone="green"
          trend="up"
          trendLabel="In catalog"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={String(orders.data?.total ?? '—')}
          hint="Mock shows paginated total"
          tone="blue"
          trend="up"
          trendLabel="This period"
        />
        <StatCard
          icon={DollarSign}
          label="Revenue (this month)"
          value={formatCurrency(revenueThisMonth)}
          tone="amber"
          trend="up"
          trendLabel="vs last month"
        />
        <StatCard
          icon={TriangleAlert}
          label="Low Stock Alerts"
          value={String(lowStock.data?.length ?? '—')}
          tone="red"
          trend={lowStock.data?.length ? 'down' : 'neutral'}
          trendLabel="Needs reorder"
        />
        <StatCard
          icon={Users}
          label="Active Customers"
          value={String(customers.data?.total ?? '—')}
          tone="purple"
          trend="up"
          trendLabel="Registered"
        />
      </div>

      {/* ── Revenue sparkline + orders table ───────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between border-b border-line bg-page px-5 py-3.5">
            <div>
              <CardTitle className="text-sm">Recent orders</CardTitle>
              <div className="mt-0.5 text-[11px] text-muted">Latest 10 — update status inline</div>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
              <Link to="/admin/orders">View all <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              rows={orders.data?.data ?? []}
              rowId={(r) => r.orderId}
              columns={[
                { key: 'id',       header: 'Order',    cell: (r) => <span className="font-mono text-xs font-medium text-ink-strong">{r.orderId.slice(0, 8)}…</span> },
                { key: 'customer', header: 'Customer', cell: (r) => <span className="text-sm text-muted">{r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : r.customerId}</span> },
                { key: 'items',    header: 'Items',    cell: (r) => <span className="text-sm text-muted">{(r.items ?? []).length}</span> },
                { key: 'total',    header: 'Total',    cell: (r) => <span className="text-sm font-semibold">{formatCurrency((r.items ?? []).reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0))}</span> },
                { key: 'date',     header: 'Date',     cell: (r) => <span className="text-xs text-muted">{formatDateTime(r.datetime)}</span> },
                {
                  key: 'status',
                  header: 'Status',
                  cell: (r) => (
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <Select
                        value={r.status}
                        onValueChange={(v) => updateStatus.mutate({ orderId: r.orderId, status: v as OrderStatus })}
                      >
                        <SelectTrigger className="h-7 w-[130px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['pending','processing','shipped','delivered','cancelled'].map((s) => (
                            <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ),
                },
              ]}
              empty={<div className="p-6 text-sm text-muted">No recent orders.</div>}
            />
          </CardContent>
        </Card>

        {/* Low stock list */}
        <Card>
          <CardHeader className="flex-row items-center justify-between border-b border-line bg-page px-5 py-3.5">
            <div>
              <CardTitle className="text-sm">Low stock</CardTitle>
              <div className="mt-0.5 text-[11px] text-muted">{lowStock.data?.length ?? 0} SKUs need attention</div>
            </div>
            <Boxes className="h-4 w-4 text-subtle" />
          </CardHeader>
          <CardContent className="space-y-2 p-4">
            {(lowStock.data ?? []).length === 0
              ? <div className="text-sm text-muted">No alerts — stock looks healthy.</div>
              : (lowStock.data ?? []).slice(0, 8).map((id) => (
                <div key={id} className="flex items-center justify-between rounded-xl border border-line bg-page px-3 py-2.5 transition-colors hover:bg-brand-tint/30">
                  <div className="text-xs font-medium text-ink-strong truncate max-w-[160px]">{id}</div>
                  <span className="inline-flex items-center rounded-full bg-red-tint px-2 py-0.5 text-[10px] font-semibold text-red">Low</span>
                </div>
              ))
            }
            {(lowStock.data?.length ?? 0) > 8 && (
              <div className="pt-1 text-center text-xs text-muted">
                +{(lowStock.data?.length ?? 0) - 8} more
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts row ─────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Top selling — horizontal bar */}
        <ChartCard
          title="Top selling products"
          subtitle="By units sold"
          loading={topProducts.isLoading}
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topProducts.data ?? []}
              layout="vertical"
              margin={{ left: 4, right: 24, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-line)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 11) + '…' : v}
              />
              <Tooltip content={<CountTooltip />} cursor={{ fill: 'var(--color-brand-tint)' }} />
              <Bar dataKey="quantity" radius={[0, 6, 6, 0]} maxBarSize={18}>
                {(topProducts.data ?? []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Revenue trend — area line */}
        <ChartCard
          title="Revenue trend"
          subtitle="Last 30 days"
          loading={sales.isLoading}
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueSparkline} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--chart-primary)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--chart-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${v}`}
                width={44}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--chart-primary)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'var(--chart-primary)', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category — donut */}
        <ChartCard
          title="Category performance"
          subtitle="Revenue by category"
          loading={categoryPerf.isLoading}
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<PieTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: 'var(--color-muted)' }}
              />
              <Pie
                data={categoryPerf.data ?? []}
                dataKey="revenue"
                nameKey="categoryName"
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                label={renderPieLabel}
                labelLine={false}
              >
                {(categoryPerf.data ?? []).map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}