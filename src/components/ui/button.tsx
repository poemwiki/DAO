import type { VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/utils/format'

// WHY: Migrate to semantic CSS variable driven button styling (similar to Badge) to avoid palette + dark utility pitfalls in Tailwind v4.
// Each variant sets --btn-* vars via .btn-variant-* utility classes (defined in index.css).
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-[var(--btn-bg)] text-[var(--btn-fg)] border border-[var(--btn-border,transparent)] shadow-[var(--btn-shadow,0_0_0_0_transparent)] hover:bg-[var(--btn-bg-hover,var(--btn-bg))] hover:text-[var(--btn-fg-hover,var(--btn-fg))] cursor-pointer',
  {
    variants: {
      variant: {
        default: 'btn-variant-default',
        destructive: 'btn-variant-destructive',
        outline: 'btn-variant-outline',
        secondary: 'btn-variant-secondary',
        soft: 'btn-variant-soft',
        ghost: 'btn-variant-ghost',
        link: 'btn-variant-link underline-offset-4 hover:underline border-none shadow-none px-0',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'soft', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
