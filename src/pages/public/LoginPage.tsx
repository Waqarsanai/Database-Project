import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { LockKeyhole, ShieldCheck, UserPlus, Eye, EyeOff } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import type { AppRole } from '@/types/auth'
import { getErrorMessage } from '@/utils/errors'

const loginSchema = z.object({
  username: z.string().min(3, 'Username is required'),
  password: z.string().min(6, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

function LoginForm({ role }: { role: AppRole }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const form = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), mode: 'onChange' })

  const submitLabel = useMemo(() => (role === 'admin' ? 'Login as Admin' : 'Login'), [role])

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await login({ ...values, role })
          toast.success('Welcome back')
          navigate(role === 'admin' ? '/admin/dashboard' : '/app/dashboard', { replace: true })
        } catch (e: unknown) {
          toast.error(getErrorMessage(e, 'Login failed'))
        }
      })}
    >
      <div className="space-y-2">
        <Label htmlFor={`${role}-username`}>Username</Label>
        <Input id={`${role}-username`} autoComplete="username" placeholder="Enter your username" {...form.register('username')} />
        {form.formState.errors.username && (
          <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${role}-password`}>Password</Label>
        <div className="relative">
          <Input
            id={`${role}-password`}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            className="pr-10"
            {...form.register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink-strong transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <a className="font-semibold text-brand hover:underline" href="mailto:support@iims.dev">
          Forgot password?
        </a>
      </div>

      <Button className="w-full" type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Signing in…' : submitLabel}
      </Button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-12rem)] max-w-5xl items-center justify-center">
      <div className="grid w-full items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">

        {/* Left panel — visible on large screens */}
        <div className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-brand-tint px-4 py-1.5 text-xs font-semibold text-brand-hover">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure access
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink-strong">
            Sign in to the inventory workspace
          </h1>
          <p className="mt-4 text-[15px] leading-[1.7] text-muted">
            Jump into admin operations or the customer storefront with a polished, production-style experience.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card className="border-line-strong bg-brand-tint">
              <CardContent className="p-5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Admin access</div>
                <div className="mt-2 text-lg font-semibold text-ink-strong">Monitor stock, orders, and analytics</div>
              </CardContent>
            </Card>
            <Card className="border-blue-line bg-blue-tint/60">
              <CardContent className="p-5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Customer access</div>
                <div className="mt-2 text-lg font-semibold text-ink-strong">Shop, reorder, and track fulfillment</div>
              </CardContent>
            </Card>
          </div>

          <p className="mt-8 text-sm text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand hover:underline">
              Create one here →
            </Link>
          </p>
        </div>

        {/* Right panel — login card */}
        <Card className="mx-auto w-full max-w-[400px] rounded-2xl">
          <CardHeader className="items-center text-center">
            <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-sm">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Access the Admin or Customer portal.{' '}
              <Link to="/register" className="font-semibold text-brand hover:underline">
                Register
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="customer">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="customer">Customer</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>
              <TabsContent value="customer" className="mt-6">
                <LoginForm role="customer" />
              </TabsContent>
              <TabsContent value="admin" className="mt-6">
                <LoginForm role="admin" />
              </TabsContent>
            </Tabs>

            {/* Mobile register link */}
            <p className="mt-5 text-center text-sm text-muted lg:hidden">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-brand hover:underline">
                Register here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}