import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { createAdmin, getAdmins, updateAdmin } from '@/api/admins.api'
import { ADMIN_ROLES } from '@/utils/constants'
import { getErrorMessage } from '@/utils/errors'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Pagination } from '@/components/shared/Pagination'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDateTime } from '@/utils/format'

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(7),
  username: z.string().min(3),
  password: z.string().min(8),
  role: z.enum(ADMIN_ROLES),
})
type CreateValues = z.infer<typeof createSchema>

export default function AdminAdminsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)

  const admins = useQuery({
    queryKey: ['admins', { page }],
    queryFn: () => getAdmins({ page, limit: 10 }),
  })

  const createM = useMutation({
    mutationFn: (values: CreateValues) => createAdmin(values),
    onSuccess: async () => {
      toast.success('Admin created')
      await qc.invalidateQueries({ queryKey: ['admins'] })
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Create failed')),
  })

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateAdmin(id, { isActive }),
    onSuccess: async () => {
      toast.success('Admin updated')
      await qc.invalidateQueries({ queryKey: ['admins'] })
    },
  })

  const form = useForm<CreateValues>({ resolver: zodResolver(createSchema), mode: 'onChange' })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admins"
        description="Manage admin accounts and roles."
        actions={
          <Dialog onOpenChange={(o) => (!o ? form.reset() : undefined)}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Add admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add admin</DialogTitle>
              </DialogHeader>
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit((v) => createM.mutate(v))}>
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input {...form.register('firstName')} />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input {...form.register('lastName')} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Email</Label>
                  <Input type="email" {...form.register('email')} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...form.register('phone')} />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={form.watch('role')}
                    onValueChange={(v) => form.setValue('role', v as CreateValues['role'], { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ADMIN_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input {...form.register('username')} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" {...form.register('password')} />
                </div>
                <DialogFooter className="sm:col-span-2">
                  <Button type="submit" disabled={!form.formState.isValid || createM.isPending}>
                    {createM.isPending ? 'Creating…' : 'Create admin'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <DataTable
        rows={admins.data?.data ?? []}
        rowId={(r) => r.adminId}
        columns={[
          { key: 'id', header: 'AdminID', cell: (r) => <span className="font-mono text-xs text-muted">{r.adminId}</span> },
          {
            key: 'name',
            header: 'Name',
            cell: (r) => (
              <span className="flex items-center gap-3 font-medium">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-tint text-[11px] font-semibold text-brand-hover">
                  {r.firstName?.[0] ?? '?'}
                  {r.lastName?.[0] ?? '?'}
                </span>
                <span>{r.firstName} {r.lastName}</span>
              </span>
            ),
          },
          { key: 'email', header: 'Email', cell: (r) => <span className="text-muted">{r.email}</span> },
          { key: 'role', header: 'Role', cell: (r) => <span className="text-muted">{r.role}</span> },
          { key: 'created', header: 'Created', cell: (r) => <span className="text-muted">{formatDateTime(r.createdAt)}</span> },
          { key: 'active', header: 'Status', cell: (r) => <StatusBadge status={r.isActive ? 'active' : 'inactive'} /> },
          {
            key: 'actions',
            header: 'Actions',
            cell: (r) => (
              <Button variant="outline" size="sm" onClick={() => toggle.mutate({ id: r.adminId, isActive: !r.isActive })}>
                {r.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            ),
          },
        ]}
        empty={<div className="text-sm text-muted">No admins found.</div>}
      />

      <Pagination page={admins.data?.page ?? page} totalPages={admins.data?.totalPages ?? 1} onPageChange={setPage} />
    </div>
  )
}
