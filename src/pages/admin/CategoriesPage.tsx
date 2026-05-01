import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { createCategory, deleteCategory, getCategories, updateCategory } from '@/api/categories.api'
import { getProducts } from '@/api/products.api'
import type { Category } from '@/types/entities'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Pagination } from '@/components/shared/Pagination'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const schema = z.object({
  categoryName: z.string().min(2),
  description: z.string().min(3),
})
type FormValues = z.infer<typeof schema>

export default function AdminCategoriesPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [edit, setEdit] = useState<Category | null>(null)

  const categories = useQuery({
    queryKey: ['categories', { page }],
    queryFn: () => getCategories({ page, limit: 10 }),
  })

  // product counts: lightweight query per category (mock-safe)
  const productCounts = useQuery({
    queryKey: ['categories', 'productCounts'],
    queryFn: async () => {
      const res = await getProducts({ page: 1, limit: 200 })
      const counts: Record<string, number> = {}
      res.data.forEach((p) => {
        counts[p.categoryId] = (counts[p.categoryId] ?? 0) + 1
      })
      return counts
    },
  })

  const createM = useMutation({
    mutationFn: (values: FormValues) => createCategory(values),
    onSuccess: async () => {
      toast.success('Category created')
      await qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const updateM = useMutation({
    mutationFn: ({ id, values }: { id: string; values: FormValues }) => updateCategory(id, values),
    onSuccess: async () => {
      toast.success('Category updated')
      setEdit(null)
      await qc.invalidateQueries({ queryKey: ['categories'] })
      await qc.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: async () => {
      toast.success('Category deleted')
      setConfirmDeleteId(null)
      await qc.invalidateQueries({ queryKey: ['categories'] })
      await qc.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const form = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onChange' })

  const rows = categories.data?.data ?? []
  const counts = productCounts.data ?? {}

  const editForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    values: {
      categoryName: edit?.categoryName ?? '',
      description: edit?.description ?? '',
    },
  })

  const actions = (
    <Dialog onOpenChange={(o) => (!o ? form.reset() : undefined)}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Add category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add category</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit((v) => createM.mutate(v))}>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...form.register('categoryName')} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...form.register('description')} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!form.formState.isValid || createM.isPending}>
              {createM.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description="Organize products for navigation and analytics." actions={actions} />

      <DataTable
        rows={rows}
        rowId={(r) => r.categoryId}
        columns={[
          { key: 'id', header: 'ID', cell: (r) => <span className="font-mono text-xs text-muted">{r.categoryId}</span> },
          { key: 'name', header: 'Name', cell: (r) => <button className="font-medium hover:underline" onClick={() => setEdit(r)}>{r.categoryName}</button> },
          { key: 'desc', header: 'Description', cell: (r) => <span className="text-muted">{r.description}</span> },
          { key: 'count', header: 'Products', cell: (r) => <span className="text-muted">{counts[r.categoryId] ?? '—'}</span> },
          {
            key: 'actions',
            header: 'Actions',
            cell: (r) => (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setEdit(r)}>
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setConfirmDeleteId(r.categoryId)}>
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        empty={<div className="text-sm text-muted">No categories found.</div>}
      />

      <Pagination page={categories.data?.page ?? page} totalPages={categories.data?.totalPages ?? 1} onPageChange={setPage} />

      <Dialog open={Boolean(edit)} onOpenChange={(o) => (!o ? setEdit(null) : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={editForm.handleSubmit((v) => edit && updateM.mutate({ id: edit.categoryId, values: v }))}>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...editForm.register('categoryName')} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea {...editForm.register('description')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEdit(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!editForm.formState.isValid || updateM.isPending}>
                {updateM.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        title="Delete category?"
        description="Products will be reassigned by backend rules (mock reassigns to first category)."
        destructive
        confirmLabel={deleteM.isPending ? 'Deleting…' : 'Delete'}
        onOpenChange={(o) => (!o ? setConfirmDeleteId(null) : undefined)}
        onConfirm={() => confirmDeleteId && deleteM.mutate(confirmDeleteId)}
      />
    </div>
  )
}
