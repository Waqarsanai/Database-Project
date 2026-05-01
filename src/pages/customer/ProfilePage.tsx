import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { authStore } from '@/store/authStore'
import { getCustomerById, updateCustomer } from '@/api/customers.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage } from '@/utils/errors'

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(7),
  address: z.string().min(5),
})
type FormValues = z.infer<typeof schema>

export default function CustomerProfilePage() {
  const qc = useQueryClient()
  const user = authStore((s) => s.user)

  const customer = useQuery({
    queryKey: ['customers', user?.id],
    queryFn: () => getCustomerById(user!.id),
    enabled: Boolean(user?.id),
  })

  const form = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onChange' })

  useEffect(() => {
    if (customer.data) {
      form.reset({
        firstName: customer.data.firstName,
        lastName: customer.data.lastName,
        email: customer.data.email,
        phone: customer.data.phone,
        address: customer.data.address,
      })
    }
  }, [customer.data, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) => updateCustomer(user!.id, values),
    onSuccess: async () => {
      toast.success('Profile updated')
      await qc.invalidateQueries({ queryKey: ['customers', user?.id] })
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Update failed')),
  })

  return (
    <div className="space-y-6">
      <PageHeader title="My profile" description="Manage your account details." />
      <Card>
        <CardHeader className="border-b border-line bg-page">
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
            <div className="space-y-2">
              <Label>First name</Label>
              <Input {...form.register('firstName')} />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input {...form.register('lastName')} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...form.register('email')} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...form.register('phone')} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address</Label>
              <Textarea {...form.register('address')} />
            </div>
            <div className="sm:col-span-2">
              <Button className="w-full" type="submit" disabled={!form.formState.isValid || mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
