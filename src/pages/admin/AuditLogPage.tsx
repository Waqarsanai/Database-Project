import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAdminProductsAudit } from '@/api/adminProducts.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Pagination } from '@/components/shared/Pagination'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime } from '@/utils/format'
import type { AdminProductAction } from '@/types/entities'

export default function AdminAuditLogPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [action, setAction] = useState<AdminProductAction | 'all'>('all')

  const audit = useQuery({
    queryKey: ['admin-products', 'audit', { page, search, action }],
    queryFn: () =>
      getAdminProductsAudit({
        page,
        limit: 10,
        search: search || undefined,
        action: action === 'all' ? undefined : action,
      }),
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description="All admin actions on products (with filtering)." />

      <div className="grid gap-3 rounded-2xl border border-line bg-card p-4 md:grid-cols-4">
        <Input className="md:col-span-2" placeholder="Search admin/product…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <Select value={action} onValueChange={(v) => { setAction(v as AdminProductAction | 'all'); setPage(1) }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="updated">Updated</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
            <SelectItem value="restocked">Restocked</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted">Total: <span className="font-medium text-ink-strong">{audit.data?.total ?? '—'}</span></div>
      </div>

      <DataTable
        rows={audit.data?.data ?? []}
        rowId={(r) => `${r.adminId}-${r.productId}-${r.actionDatetime}`}
        columns={[
          { key: 'admin', header: 'Admin', cell: (r) => <span className="font-medium">{r.adminName ?? r.adminId}</span> },
          { key: 'product', header: 'Product', cell: (r) => <span className="text-muted">{r.productName ?? r.productId}</span> },
          { key: 'action', header: 'Action', cell: (r) => <span className="font-medium">{r.action}</span> },
          { key: 'time', header: 'Timestamp', cell: (r) => <span className="text-muted">{formatDateTime(r.actionDatetime)}</span> },
        ]}
        empty={<div className="text-sm text-muted">No audit actions found.</div>}
      />

      <Pagination page={audit.data?.page ?? page} totalPages={audit.data?.totalPages ?? 1} onPageChange={setPage} />
    </div>
  )
}
