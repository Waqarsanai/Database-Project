import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getCustomers, patchCustomerStatus } from '@/api/customers.api'
import { getOrders } from '@/api/orders.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Pagination } from '@/components/shared/Pagination'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDateTime } from '@/utils/format'
import { getErrorMessage } from '@/utils/errors'

export default function AdminCustomersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 250)

  const customers = useQuery({
    queryKey: ['customers', { page, search: debounced }],
    queryFn: () => getCustomers({ page, limit: 10, search: debounced || undefined }),
  })

  const orders = useQuery({
    queryKey: ['orders', { page: 1, limit: 200 }],
    queryFn: () => getOrders({ page: 1, limit: 200 }),
  })

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => patchCustomerStatus(id, isActive),
    onSuccess: async () => {
      toast.success('Customer updated')
      await qc.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Update failed')),
  })

  const orderCount = (customerId: string) =>
    (orders.data?.data ?? []).filter((o) => o.customerId === customerId).length

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Manage customer accounts and status." />

      <div className="rounded-2xl border border-line bg-card p-4">
        <Input
          placeholder="Search customers…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </div>

      <DataTable
        rows={customers.data?.data ?? []}
        rowId={(r) => r.customerId}
        columns={[
          { key: 'id', header: 'ID', cell: (r) => <span className="font-mono text-xs text-muted">{r.customerId}</span> },
          {
            key: 'name',
            header: 'Name',
            cell: (r) => (
              <Link className="flex items-center gap-3 font-medium hover:underline" to={`/admin/customers/${r.customerId}`}>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-tint text-[11px] font-semibold text-blue">
                  {r.firstName[0]}
                  {r.lastName[0]}
                </span>
                <span>{r.firstName} {r.lastName}</span>
              </Link>
            ),
          },
          { key: 'email', header: 'Email', cell: (r) => <span className="text-muted">{r.email}</span> },
          { key: 'phone', header: 'Phone', cell: (r) => <span className="text-muted">{r.phone}</span> },
          { key: 'orders', header: 'Orders', cell: (r) => <span className="text-muted">{orderCount(r.customerId)}</span> },
          { key: 'joined', header: 'Joined', cell: (r) => <span className="text-muted">{formatDateTime(r.createdAt)}</span> },
          { key: 'active', header: 'Status', cell: (r) => <StatusBadge status={r.isActive ? 'active' : 'inactive'} /> },
          {
            key: 'actions',
            header: 'Actions',
            cell: (r) => (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggle.mutate({ id: r.customerId, isActive: !r.isActive })}
              >
                {r.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            ),
          },
        ]}
        empty={<div className="text-sm text-muted">No customers found.</div>}
      />

      <Pagination page={customers.data?.page ?? page} totalPages={customers.data?.totalPages ?? 1} onPageChange={setPage} />
    </div>
  )
}
