import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'

// WHY: Avoid relying on `dark:` utilities for arbitrary values in Tailwind v4 (produced empty rules).
// Each `.badge-color-*` utility defines unified CSS vars for both modes; dark theme overrides vars via `.dark .badge-color-*`.
// Component only references the base vars (no `dark:` utilities needed).
const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs select-none transition-colors bg-[var(--badge-bg)] text-[var(--badge-fg)]',
  {
    variants: {
      color: {
        neutral: 'badge-color-neutral',
        gray: 'badge-color-gray',
        blue: 'badge-color-blue',
        green: 'badge-color-green',
        red: 'badge-color-red',
        yellow: 'badge-color-yellow',
        orange: 'badge-color-orange',
        purple: 'badge-color-purple',
        slate: 'badge-color-slate',
        cyan: 'badge-color-cyan',
      },
      outline: {
        true: '!bg-transparent ring-1 ring-inset ring-[var(--badge-ring)] text-[var(--badge-outline-fg,var(--badge-fg))] badge-outline-mode',
        false: '',
      },
    },
    defaultVariants: { color: 'neutral', outline: false },
  },
)

type VariantColor = NonNullable<VariantProps<typeof badgeVariants>['color']>

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'>,
    VariantProps<typeof badgeVariants> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  color,
  outline,
  leftIcon,
  rightIcon,
  children,
  ...rest
}) => {
  return (
    <span
      className={clsx(
        badgeVariants({ color: color as VariantColor | undefined, outline }),
        className,
      )}
      {...rest}
    >
      {leftIcon && (
        <span className="mr-1 inline-flex items-center">{leftIcon}</span>
      )}
      {children}
      {rightIcon && (
        <span className="ml-1 inline-flex items-center">{rightIcon}</span>
      )}
    </span>
  )
}

export default Badge
