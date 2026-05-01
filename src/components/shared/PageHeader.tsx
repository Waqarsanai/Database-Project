import { cn } from '@/utils/cn'

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-6 flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">Workspace</div>
        <h1 className="truncate text-[28px] font-bold tracking-tight text-ink-strong">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">{actions}</div> : null}
    </div>
  )
}
