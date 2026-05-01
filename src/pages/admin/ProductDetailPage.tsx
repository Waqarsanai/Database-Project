import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getProductById, getProducts, updateProduct } from '@/api/products.api'
import { getAdminProductsAudit } from '@/api/adminProducts.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/shared/DataTable'
import { ChartCard } from '@/components/charts/ChartCard'
import { formatDateTime } from '@/utils/format'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { getErrorMessage } from '@/utils/errors'

const schema = z.object({
  name: z.string().min(2),
  price: z.number().positive(),
  stockQty: z.number().int().min(0),
})
type FormValues = z.infer<typeof schema>

export default function AdminProductDetailPage() {
  const { id } = useParams()

  const product = useQuery({
    queryKey: ['products', id],
    queryFn: () => getProductById(id!),
    enabled: Boolean(id),
  })

  const audit = useQuery({
    queryKey: ['admin-products', 'audit', { productId: id }],
    queryFn: () => getAdminProductsAudit({ page: 1, limit: 50, search: id }),
    enabled: Boolean(id),
  })

  const related = useQuery({
    queryKey: ['products', 'related', product.data?.categoryId],
    queryFn: () => getProducts({ page: 1, limit: 6, categoryId: product.data!.categoryId }),
    enabled: Boolean(product.data?.categoryId),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    values: {
      name: product.data?.name ?? '',
      price: product.data?.price ?? 0,
      stockQty: product.data?.stockQty ?? 0,
    },
  })

  const history = (audit.data?.data ?? [])
    .filter((a) => a.productId === id)
    .map((a) => ({ date: a.actionDatetime.slice(0, 10), action: a.action }))

  type AggRow = {
    date: string
    updated: number
    restocked: number
    created: number
    deleted: number
  }

  const historyAgg = Object.values(
    history.reduce<Record<string, AggRow>>((acc, h) => {
      const cur: AggRow = acc[h.date] ?? { date: h.date, updated: 0, restocked: 0, created: 0, deleted: 0 }
      cur[h.action] = (cur[h.action] ?? 0) + 1
      acc[h.date] = cur
      return acc
    }, {}),
  ).sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.data?.name ?? 'Product'}
        description={product.data ? `ID: ${product.data.productId}` : undefined}
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/products">Back</Link>
          </Button>
        }
      />

      {product.data ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Edit product</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={form.handleSubmit(async (values) => {
                  try {
                    await updateProduct(product.data!.productId, values)
                    toast.success('Saved')
                  } catch (e: unknown) {
                    toast.error(getErrorMessage(e, 'Save failed'))
                  }
                })}
              >
                <div className="space-y-2 sm:col-span-2">
                  <Label>Name</Label>
                  <Input {...form.register('name')} />
                </div>
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input type="number" step="0.01" {...form.register('price', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Stock Qty</Label>
                  <Input type="number" {...form.register('stockQty', { valueAsNumber: true })} />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting}>
                    Save changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <ChartCard title="Stock history (audit actions)" loading={audit.isLoading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyAgg}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="updated" fill="var(--chart-primary)" />
                <Bar dataKey="restocked" fill="var(--chart-secondary)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-card p-6 text-sm text-muted">Loading…</div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Admin action history</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rows={(audit.data?.data ?? []).filter((a) => a.productId === id)}
              rowId={(r) => `${r.adminId}-${r.productId}-${r.actionDatetime}`}
              columns={[
                { key: 'admin', header: 'Admin', cell: (r) => <span className="text-muted">{r.adminName ?? r.adminId}</span> },
                { key: 'action', header: 'Action', cell: (r) => <span className="font-medium">{r.action}</span> },
                { key: 'when', header: 'When', cell: (r) => <span className="text-muted">{formatDateTime(r.actionDatetime)}</span> },
              ]}
              empty={<div className="text-sm text-muted">No audit actions found.</div>}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Related products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(related.data?.data ?? [])
              .filter((p) => p.productId !== id)
              .slice(0, 5)
              .map((p) => (
                <Link key={p.productId} to={`/admin/products/${p.productId}`} className="block rounded-xl border border-line bg-page p-3 hover:border-line-strong">
                  <div className="text-sm font-medium text-ink-strong">{p.name}</div>
                  <div className="text-xs text-muted">{p.productId}</div>
                </Link>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
