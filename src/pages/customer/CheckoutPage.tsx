import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createOrder } from '@/api/orders.api'
import { getCustomerById } from '@/api/customers.api'
import { authStore } from '@/store/authStore'
import { cartStore } from '@/store/cartStore'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/utils/format'
import { getErrorMessage } from '@/utils/errors'

const schema = z.object({
  address: z.string().min(5, 'Address is required'),
})
type FormValues = z.infer<typeof schema>

export default function CheckoutPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = authStore((s) => s.user)
  const items = cartStore((s) => s.items)
  const clearCart = cartStore((s) => s.clearCart)
  const subtotal = cartStore((s) => s.subtotal)

  const customer = useQuery({
    queryKey: ['customers', user?.id],
    queryFn: () => getCustomerById(user!.id),
    enabled: Boolean(user?.id),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    values: { address: customer.data?.address ?? '' },
  })

  const canCheckout = useMemo(() => items.length > 0 && Boolean(user?.id), [items.length, user?.id])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user?.id) throw new Error('Missing user')
      return createOrder({
        customerId: user.id,
        address: values.address,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      })
    },
    onSuccess: async (order) => {
      toast.success('Order placed')
      clearCart()
      await qc.invalidateQueries({ queryKey: ['orders'] })
      navigate(`/app/checkout/success/${order.orderId}`, { replace: true })
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Checkout failed')),
  })

  if (!canCheckout) {
    return (
      <div className="space-y-6">
        <PageHeader title="Checkout" description="Your cart is empty." />
        <Card>
          <CardContent className="p-10 text-center">
            <Button onClick={() => navigate('/app/products')}>Browse products</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Checkout" description="Review and place your order." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-line bg-page">
            <CardTitle>Shipping</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(async (values) => mutation.mutate(values))}
            >
              <div className="space-y-2">
                <Label>Address</Label>
                <Input {...form.register('address')} />
                {form.formState.errors.address ? (
                  <div className="text-sm text-red">{form.formState.errors.address.message}</div>
                ) : null}
              </div>
              <Button className="w-full" type="submit" disabled={!form.formState.isValid || mutation.isPending}>
                {mutation.isPending ? 'Placing…' : 'Place order'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b border-line bg-page">
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((i) => (
              <div key={i.productId} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-page px-3 py-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium text-ink-strong">{i.product.name}</div>
                  <div className="text-muted">Qty: {i.quantity}</div>
                </div>
                <div className="shrink-0 font-medium text-ink-strong">
                  {formatCurrency(i.product.price * i.quantity)}
                </div>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-line pt-3 text-sm">
              <span className="text-muted">Total</span>
              <span className="font-semibold text-ink-strong">{formatCurrency(subtotal())}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
