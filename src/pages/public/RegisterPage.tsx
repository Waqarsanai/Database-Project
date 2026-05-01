import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { UserPlus, ShieldCheck, Eye, EyeOff, User } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/utils/errors'

// ── Schemas ──────────────────────────────────────────────────────────────────

const customerSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(7, 'Invalid phone'),
  password: z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string().min(1, 'Required'),
  address: z.string().min(5, 'Address required'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

const adminSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(7, 'Invalid phone'),
  password: z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string().min(1, 'Required'),
  inviteCode: z.string().min(4, 'Invite code required'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type CustomerFormValues = z.infer<typeof customerSchema>
type AdminFormValues = z.infer<typeof adminSchema>

// ── Reusable password field ───────────────────────────────────────────────────

function PasswordField({
  id,
  label,
  autoComplete,
  placeholder,
  error,
  registration,
}: {
  id: string
  label: string
  autoComplete?: string
  placeholder?: string
  error?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="pr-10"
          {...registration}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink-strong transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

// ── Customer registration form ────────────────────────────────────────────────

function CustomerRegisterForm() {
  const { registerCustomer } = useAuth()
  const navigate = useNavigate()
  const form = useForm<CustomerFormValues>({ resolver: zodResolver(customerSchema), mode: 'onChange' })
  const { errors, isValid, isSubmitting } = form.formState

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          const res = await registerCustomer(values)
          // The response should contain the generated username
          const username = (res as any)?.user?.username
          toast.success(`Account created! Your username is: ${username}. It has also been emailed to you.`, { duration: 10000 })
          navigate('/app/dashboard', { replace: true })
        } catch (e: unknown) {
          toast.error(getErrorMessage(e, 'Registration failed'))
        }
      })}
    >
      <div className="space-y-2">
        <Label htmlFor="c-firstName">First name</Label>
        <Input id="c-firstName" placeholder="John" {...form.register('firstName')} />
        {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="c-lastName">Last name</Label>
        <Input id="c-lastName" placeholder="Doe" {...form.register('lastName')} />
        {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="c-email">Email</Label>
        <Input id="c-email" type="email" autoComplete="email" placeholder="john@example.com" {...form.register('email')} />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="c-phone">Phone</Label>
        <Input id="c-phone" autoComplete="tel" placeholder="+1 234 567 8900" {...form.register('phone')} />
        {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
      </div>

      <PasswordField
        id="c-password"
        label="Password"
        autoComplete="new-password"
        placeholder="Min 8 characters"
        error={errors.password?.message}
        registration={form.register('password')}
      />

      <PasswordField
        id="c-confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        placeholder="Repeat password"
        error={errors.confirmPassword?.message}
        registration={form.register('confirmPassword')}
      />

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="c-address">Delivery address</Label>
        <Textarea id="c-address" placeholder="123 Main St, City, Country" rows={2} {...form.register('address')} />
        {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
      </div>

      <div className="sm:col-span-2">
        <Button className="w-full" type="submit" disabled={!isValid || isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create customer account'}
        </Button>
      </div>
    </form>
  )
}

// ── Admin registration form ───────────────────────────────────────────────────

function AdminRegisterForm() {
  const { registerCustomer } = useAuth()
  const navigate = useNavigate()
  const form = useForm<AdminFormValues>({ resolver: zodResolver(adminSchema), mode: 'onChange' })
  const { errors, isValid, isSubmitting } = form.formState

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          // registerCustomer with role override – adapt to your API as needed
          const res = await registerCustomer({ ...values, role: 'admin' } as never)
          const username = (res as any)?.user?.username
          toast.success(`Admin account created! Your username is: ${username}. It has also been emailed to you.`, { duration: 10000 })
          navigate('/admin/dashboard', { replace: true })
        } catch (e: unknown) {
          toast.error(getErrorMessage(e, 'Registration failed'))
        }
      })}
    >
      <div className="space-y-2">
        <Label htmlFor="a-firstName">First name</Label>
        <Input id="a-firstName" placeholder="Jane" {...form.register('firstName')} />
        {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="a-lastName">Last name</Label>
        <Input id="a-lastName" placeholder="Smith" {...form.register('lastName')} />
        {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="a-email">Work email</Label>
        <Input id="a-email" type="email" autoComplete="email" placeholder="jane@company.com" {...form.register('email')} />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="a-phone">Phone</Label>
        <Input id="a-phone" autoComplete="tel" placeholder="+1 234 567 8900" {...form.register('phone')} />
        {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
      </div>

      <PasswordField
        id="a-password"
        label="Password"
        autoComplete="new-password"
        placeholder="Min 8 characters"
        error={errors.password?.message}
        registration={form.register('password')}
      />

      <PasswordField
        id="a-confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        placeholder="Repeat password"
        error={errors.confirmPassword?.message}
        registration={form.register('confirmPassword')}
      />

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="a-inviteCode">Admin invite code</Label>
        <Input
          id="a-inviteCode"
          placeholder="Provided by your organization"
          {...form.register('inviteCode')}
        />
        {errors.inviteCode && <p className="text-sm text-red-500">{errors.inviteCode.message}</p>}
        <p className="text-xs text-muted">Contact your organization admin to obtain an invite code.</p>
      </div>

      <div className="sm:col-span-2">
        <Button className="w-full" type="submit" disabled={!isValid || isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create admin account'}
        </Button>
      </div>
    </form>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-12rem)] max-w-5xl items-center justify-center py-8">
      <div className="grid w-full items-start gap-10 lg:grid-cols-[0.95fr_1.05fr]">

        {/* Left panel */}
        <div className="hidden lg:block lg:pt-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-brand-tint px-4 py-1.5 text-xs font-semibold text-brand-hover">
            <UserPlus className="h-3.5 w-3.5" />
            New account
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink-strong">
            Join the inventory workspace
          </h1>
          <p className="mt-4 text-[15px] leading-[1.7] text-muted">
            Register as a customer to shop and track orders, or as an admin to manage inventory and operations.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card className="border-line-strong bg-brand-tint">
              <CardContent className="p-5">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <User className="h-4 w-4" />
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Customer</div>
                <div className="mt-1 text-sm font-semibold text-ink-strong">Browse products, place orders, track fulfillment</div>
              </CardContent>
            </Card>
            <Card className="border-line-strong bg-card">
              <CardContent className="p-5">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Admin</div>
                <div className="mt-1 text-sm font-semibold text-ink-strong">Manage stock, users, analytics — requires invite code</div>
              </CardContent>
            </Card>
          </div>

          <p className="mt-8 text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand hover:underline">
              Sign in →
            </Link>
          </p>
        </div>

        {/* Right panel — register card */}
        <Card className="mx-auto w-full max-w-[480px] rounded-2xl">
          <CardHeader className="items-center text-center">
            <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-sm">
              <UserPlus className="h-6 w-6" />
            </div>
            <CardTitle>Create an account</CardTitle>
            <CardDescription>
              Customer or Admin — choose your role below.{' '}
              <Link to="/login" className="font-semibold text-brand hover:underline">
                Sign in instead
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="customer">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="customer">
                  <User className="mr-1.5 h-3.5 w-3.5" />
                  Customer
                </TabsTrigger>
                <TabsTrigger value="admin">
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                  Admin
                </TabsTrigger>
              </TabsList>
              <TabsContent value="customer" className="mt-6">
                <CustomerRegisterForm />
              </TabsContent>
              <TabsContent value="admin" className="mt-6">
                <AdminRegisterForm />
              </TabsContent>
            </Tabs>

            {/* Mobile login link */}
            <p className="mt-5 text-center text-sm text-muted lg:hidden">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-brand hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}