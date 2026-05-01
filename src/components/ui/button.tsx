import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-tint disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4',
  {
    variants: {
      variant: {
        default: 'border-brand bg-brand text-white shadow-sm hover:border-brand-hover hover:bg-brand-hover',
        secondary: 'border-line-strong bg-card text-brand-hover hover:bg-brand-soft',
        outline: 'border-line bg-card text-muted hover:border-line-strong hover:bg-brand-soft hover:text-ink-deep',
        destructive: 'border-red-line bg-card text-red hover:bg-red-tint',
        ghost: 'border-transparent bg-transparent text-muted hover:bg-brand-soft hover:text-ink-deep',
        link: 'border-transparent bg-transparent px-0 text-brand-hover underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-[12px]',
        lg: 'h-11 px-6 text-sm',
        icon: 'h-9 w-9 rounded-full',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
