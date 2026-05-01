import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-purple-line bg-purple-tint text-purple-text',
        secondary: 'border-blue-line bg-blue-tint text-blue-text',
        outline: 'border-line bg-card text-muted',
        success: 'border-line-strong bg-brand-tint text-brand-text',
        warning: 'border-amber-line bg-amber-tint text-amber-text',
        destructive: 'border-red-line bg-red-tint text-red',
        info: 'border-blue-line bg-blue-tint text-blue-text',
        processing: 'border-purple-line bg-purple-tint text-purple-text',
        neutral: 'border-line bg-page text-muted',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
