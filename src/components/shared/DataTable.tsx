import { useMemo, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/utils/cn'

export interface DataTableColumn<T> {
  key: string
  header: string
  className?: string
  cell: (row: T) => React.ReactNode
}

export function DataTable<T>({
  rows,
  columns,
  rowId,
  selectable,
  onSelectionChange,
  empty,
  className,
}: {
  rows: T[]
  columns: Array<DataTableColumn<T>>
  rowId: (row: T) => string
  selectable?: boolean
  onSelectionChange?: (ids: string[]) => void
  empty?: React.ReactNode
  className?: string
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const ids = useMemo(() => rows.map(rowId), [rows, rowId])
  const selectedIds = useMemo(() => ids.filter((id) => selected[id]), [ids, selected])

  function setAll(v: boolean) {
    const next: Record<string, boolean> = {}
    ids.forEach((id) => (next[id] = v))
    setSelected(next)
    onSelectionChange?.(v ? [...ids] : [])
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = { ...s, [id]: !s[id] }
      onSelectionChange?.(ids.filter((x) => next[x]))
      return next
    })
  }

  if (rows.length === 0) return <div className={cn('rounded-xl border border-line bg-card p-6', className)}>{empty ?? 'No data'}</div>

  const allChecked = selectedIds.length > 0 && selectedIds.length === ids.length
  const someChecked = selectedIds.length > 0 && selectedIds.length < ids.length

  return (
    <div className={cn('overflow-hidden rounded-xl border border-line bg-card', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {selectable ? (
              <TableHead className="w-10">
                <Checkbox checked={allChecked ? true : someChecked ? 'indeterminate' : false} onCheckedChange={(v) => setAll(Boolean(v))} />
              </TableHead>
            ) : null}
            {columns.map((c) => (
              <TableHead key={c.key} className={cn(c.className)}>
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const id = rowId(r)
            return (
              <TableRow key={id}>
                {selectable ? (
                  <TableCell className="w-10">
                    <Checkbox checked={Boolean(selected[id])} onCheckedChange={() => toggle(id)} />
                  </TableCell>
                ) : null}
                {columns.map((c) => (
                  <TableCell key={c.key} className={cn(c.className)}>
                    {c.cell(r)}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
