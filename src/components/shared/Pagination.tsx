import { Button } from '@/components/ui/button'

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3">
      <div className="text-sm text-muted">
        Page <span className="font-semibold text-ink-strong">{page}</span> of{' '}
        <span className="font-semibold text-ink-strong">{totalPages}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}
