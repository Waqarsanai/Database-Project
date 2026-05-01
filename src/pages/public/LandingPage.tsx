import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Boxes,
  ChartColumn,
  ShieldCheck,
  Sparkles,
  Users,
  TrendingUp,
  Package,
  Zap,
  UserPlus,
} from 'lucide-react'
import { getProducts } from '@/api/products.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ProductCard } from '@/components/shared/ProductCard'
import { Skeleton } from '@/components/ui/skeleton'

/* ─── Animated counter ───────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 1200) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let start = 0
    const step = Math.ceil(target / (duration / 16))
    const timer = setInterval(() => {
      start = Math.min(start + step, target)
      if (ref.current) ref.current.textContent = String(start)
      if (start >= target) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return ref
}

function AnimatedStat({ value, label }: { value: number; label: string }) {
  const ref = useCountUp(value)
  return (
    <div>
      <div className="text-2xl font-bold tracking-tight text-ink-deep tabular-nums">
        <span ref={ref}>0</span>
      </div>
      <div className="mt-0.5 text-sm text-muted">{label}</div>
    </div>
  )
}

/* ─── Floating badge ─────────────────────────────────────────────────────── */
function FloatingBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`absolute z-10 rounded-2xl border border-line-strong bg-card/90 px-4 py-3 shadow-lg backdrop-blur-sm ${className ?? ''}`}>
      {children}
    </div>
  )
}

/* ─── Demand bar chart ───────────────────────────────────────────────────── */
const BAR_DATA = [28, 42, 34, 56, 49, 68, 60, 74, 66, 82]

function DemandChart() {
  return (
    <div className="rounded-2xl border border-line bg-page p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Demand pulse</div>
          <div className="text-sm font-semibold text-ink-strong">Next 7 days</div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-tint px-2.5 py-1 text-[10px] font-semibold text-brand-hover">
          <TrendingUp className="h-3 w-3" />
          +14%
        </span>
      </div>
      <div className="flex h-28 items-end gap-1.5">
        {BAR_DATA.map((height, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-lg"
            style={{
              height: `${height}%`,
              background: i > 6
                ? 'color-mix(in srgb, var(--color-brand) 80%, transparent)'
                : 'color-mix(in srgb, var(--color-brand) 22%, transparent)',
              animation: `barRise 0.5s ease-out ${i * 60}ms both`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── Hero right panel ───────────────────────────────────────────────────── */
function HeroPanel() {
  return (
    <div className="relative">
      <FloatingBadge className="-left-6 -top-5 hidden lg:block">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
            <Zap className="h-3.5 w-3.5" />
          </span>
          <div>
            <div className="text-[10px] font-semibold text-subtle">Fulfillment</div>
            <div className="text-sm font-bold text-ink-strong">87% on-time</div>
          </div>
        </div>
      </FloatingBadge>

      <FloatingBadge className="-bottom-5 -right-4 hidden lg:block">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
            <Package className="h-3.5 w-3.5" />
          </span>
          <div>
            <div className="text-[10px] font-semibold text-subtle">Low stock</div>
            <div className="text-sm font-bold text-ink-strong">10 SKUs flagged</div>
          </div>
        </div>
      </FloatingBadge>

      <Card className="overflow-hidden border-line-strong bg-card shadow-xl">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Control panel</div>
              <div className="mt-1.5 text-xl font-semibold text-ink-strong">Business at a glance</div>
            </div>
            <div className="rounded-xl bg-brand-tint px-3 py-2 text-right">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Revenue</div>
              <div className="text-lg font-bold text-ink-deep">$1,196</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line bg-page p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Low stock</div>
              <div className="mt-2 text-2xl font-bold text-red">10</div>
              <div className="mt-1 text-xs text-muted">Critical SKUs monitored</div>
            </div>
            <div className="rounded-xl border border-line bg-page p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Fulfillment</div>
              <div className="mt-2 text-2xl font-bold text-blue">87%</div>
              <div className="mt-1 text-xs text-muted">Orders shipped on time</div>
            </div>
          </div>

          <DemandChart />

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-line-strong bg-brand-tint p-4">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-card text-brand-hover">
                <Boxes className="h-4 w-4" />
              </div>
              <div className="text-xs font-semibold text-ink-strong">Admin module</div>
              <div className="mt-0.5 text-xs text-muted">Orders, analytics, exports</div>
            </div>
            <div className="rounded-2xl border border-blue-line bg-blue-tint/70 p-4">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-card text-blue">
                <Users className="h-4 w-4" />
              </div>
              <div className="text-xs font-semibold text-ink-strong">Customer module</div>
              <div className="mt-0.5 text-xs text-muted">Browse, cart, checkout</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const featured = useQuery({
    queryKey: ['products', { page: 1, limit: 6, sortBy: 'stockQty', order: 'desc' }],
    queryFn: () => getProducts({ page: 1, limit: 6, sortBy: 'stockQty', order: 'desc' }),
  })

  useEffect(() => {
    if (featured.isError) {
      console.error('[LandingPage] featured products query failed', featured.error)
    }
  }, [featured.error, featured.isError])

  return (
    <>
      {/* global keyframes */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes barRise {
          from { transform: scaleY(0); transform-origin: bottom; opacity: 0; }
          to   { transform: scaleY(1); transform-origin: bottom; opacity: 1; }
        }
      `}</style>

      <div className="space-y-16">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-2xl">

            {/* eyebrow */}
            <div
              className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-brand-tint px-4 py-1.5 text-xs font-semibold text-brand-hover"
              style={{ animation: 'fadeUp 0.4s ease-out both' }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI-driven inventory intelligence
            </div>

            {/* headline */}
            <h1
              className="mt-5 text-[38px] font-bold tracking-tight text-ink-strong sm:text-[48px] sm:leading-[1.1]"
              style={{ animation: 'fadeUp 0.45s ease-out 0.05s both' }}
            >
              Intelligent inventory
              <span className="relative ml-2 text-brand">
                control
                <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-brand opacity-30" aria-hidden />
              </span>{' '}
              for modern commerce
            </h1>

            <p
              className="mt-5 text-[15px] leading-[1.7] text-muted"
              style={{ animation: 'fadeUp 0.45s ease-out 0.1s both' }}
            >
              Operate faster with real-time stock control, order processing, and analytics like
              demand forecasting and market basket insights.
            </p>

            {/* CTA group */}
            <div
              className="mt-7 flex flex-wrap items-center gap-3"
              style={{ animation: 'fadeUp 0.45s ease-out 0.15s both' }}
            >
              <Button asChild size="lg" className="gap-2 px-6 shadow-md shadow-brand/20">
                <Link to="/login">
                  Login <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button asChild size="lg" variant="secondary" className="gap-2 px-6">
                <Link to="/register">
                  Create account <UserPlus className="h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="ghost" size="lg">
                <Link to="/app/products">Browse products</Link>
              </Button>
            </div>

            {/* social proof */}
            <div
              className="mt-4 flex items-center gap-2 text-xs text-muted"
              style={{ animation: 'fadeUp 0.45s ease-out 0.18s both' }}
            >
              <span className="inline-flex -space-x-1.5">
                {['bg-brand', 'bg-blue', 'bg-amber', 'bg-purple'].map((c, i) => (
                  <span key={i} className={`inline-block h-5 w-5 rounded-full border-2 border-card ${c} opacity-80`} />
                ))}
              </span>
              <span>Join 5+ admins already managing inventory</span>
            </div>

            {/* stats */}
            <div
              className="mt-8 grid gap-6 border-t border-line-strong pt-6 sm:grid-cols-3"
              style={{ animation: 'fadeUp 0.45s ease-out 0.2s both' }}
            >
              <AnimatedStat value={24} label="Live catalog SKUs" />
              <AnimatedStat value={16} label="Recent mock orders" />
              <AnimatedStat value={5} label="Admin operators" />
            </div>
          </div>

          {/* right panel */}
          <div style={{ animation: 'fadeUp 0.5s ease-out 0.25s both' }}>
            <HeroPanel />
          </div>
        </section>

        {/* ── Feature cards ────────────────────────────────────────── */}
        <section>
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-ink-strong">
              Everything you need to run operations
            </h2>
            <p className="mt-2 text-sm text-muted">
              Built for both admins who manage and customers who shop.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: 'Operational visibility', desc: 'Healthy, low, and critical stock surfaces stay visible without noise.', tone: 'bg-brand-tint text-brand-hover' },
              { icon: ChartColumn, title: 'Analytics built in', desc: 'Sales, category performance, and forecasting — not placeholders.', tone: 'bg-blue-tint text-blue' },
              { icon: Sparkles, title: 'Guided automation', desc: 'Recommendations and audit trails keep actionability close to the UI.', tone: 'bg-amber-tint text-amber' },
              { icon: Users, title: 'Ready for teams', desc: 'Separate admin and customer surfaces with clear visual hierarchy.', tone: 'bg-purple-tint text-purple' },
            ].map(({ icon: Icon, title, desc, tone }, i) => (
              <Card
                key={title}
                className="group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{ animation: `fadeUp 0.4s ease-out ${0.05 * i}s both` }}
              >
                <CardContent className="p-5">
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-sm font-semibold text-ink-strong">{title}</div>
                  <div className="mt-2 text-sm leading-relaxed text-muted">{desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Role CTA band ────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-2xl border border-line-strong bg-gradient-to-br from-brand-tint via-card to-blue-tint/40 p-8 lg:p-10">
          {/* decorative blobs */}
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, var(--color-brand), transparent 70%)' }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-10 left-1/3 h-40 w-40 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, var(--color-blue), transparent 70%)' }}
            aria-hidden
          />

          <div className="relative z-10 grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Get started</div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink-strong">
                Choose how you want to join
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Register as a customer to shop and track your orders, or as an admin to manage
                inventory, analytics, and your team.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-line-strong bg-card/80 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-tint text-brand-hover">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-semibold text-ink-strong">Customer</div>
                  <div className="mt-1 text-xs text-muted">Browse, order, and track fulfillment</div>
                  <Button asChild size="sm" className="mt-4 w-full" variant="secondary">
                    <Link to="/register">Register as customer</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-line-strong bg-card/80 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-tint text-brand-hover">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-semibold text-ink-strong">Admin</div>
                  <div className="mt-1 text-xs text-muted">Manage products, orders & analytics</div>
                  <Button asChild size="sm" className="mt-4 w-full">
                    <Link to="/register">Register as admin</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ── Featured products ────────────────────────────────────── */}
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-ink-strong">Featured products</h2>
              <p className="mt-1 text-sm text-muted">
                Live mock data flowing through the same API layer as the app.
              </p>
            </div>
            <Button asChild variant="ghost">
              <Link to="/app/products" className="gap-1.5">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {featured.isError ? (
            <div className="rounded-xl border border-line bg-card p-6 text-sm text-muted">
              Couldn't load featured products. Set{' '}
              <code className="rounded bg-page px-1 py-0.5 font-mono text-xs">VITE_USE_MOCK=true</code>{' '}
              in your <code className="rounded bg-page px-1 py-0.5 font-mono text-xs">.env</code>.
            </div>
          ) : featured.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full rounded-none" />
                  <CardContent className="space-y-2 p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="mt-2 h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (featured.data?.data?.length ?? 0) > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(featured.data?.data ?? []).map((p) => (
                <ProductCard key={p.productId} product={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-line bg-card p-6 text-sm text-muted">
              No featured products yet.
            </div>
          )}
        </section>

      </div>
    </>
  )
}