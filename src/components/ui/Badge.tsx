import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'

// Tailwind v4 classes: using color tokens and fallback gray set
const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs select-none transition-colors',
  {
    variants: {
      color: {
        neutral: 'bg-gray-500 dark:bg-gray-800/60',
        gray: 'bg-gray-500 dark:bg-gray-800/60',
        blue: 'bg-blue-500/70 dark:bg-blue-500/25',
        green: 'bg-primary/60 dark:bg-primary/25',
        red: 'bg-destructive/60 dark:bg-destructive/25',
        yellow: 'bg-yellow-500/80 dark:bg-yellow-500/30',
        orange: 'bg-orange-500/70 dark:bg-orange-500/25',
        purple: 'bg-purple-500/70 dark:bg-purple-500/25',
        slate: 'bg-slate-500/70 dark:bg-slate-500/25',
        cyan: 'bg-cyan-500/70 dark:bg-cyan-500/25',
      },
      outline: {
        true: '!bg-transparent ring-1 ring-inset',
        false: '',
      },
    },
    compoundVariants: [
      {
        color: 'blue',
        outline: true,
        class: 'text-blue-600 dark:text-blue-300 ring-blue-400/50 dark:ring-blue-400/40',
      },
      {
        color: 'green',
        outline: true,
        class: 'text-green-600 dark:text-green-300 ring-green-400/50 dark:ring-green-400/40',
      },
      {
        color: 'red',
        outline: true,
        class: 'text-red-600 dark:text-red-300 ring-red-400/50 dark:ring-red-400/40',
      },
      {
        color: 'yellow',
        outline: true,
        class: 'text-yellow-700 dark:text-yellow-200 ring-yellow-400/60 dark:ring-yellow-400/40',
      },
      {
        color: 'purple',
        outline: true,
        class: 'text-purple-600 dark:text-purple-300 ring-purple-400/50 dark:ring-purple-400/40',
      },
      {
        color: 'orange',
        outline: true,
        class: 'text-orange-600 dark:text-orange-300 ring-orange-400/50 dark:ring-orange-400/40',
      },
      {
        color: 'slate',
        outline: true,
        class: 'text-slate-500 dark:text-slate-300 ring-slate-400/50 dark:ring-slate-400/40',
      },
      {
        color: 'cyan',
        outline: true,
        class: 'text-cyan-600 dark:text-cyan-300 ring-cyan-400/50 dark:ring-cyan-400/40',
      },
      {
        color: 'gray',
        outline: true,
        class: 'text-gray-700 dark:text-gray-300 ring-gray-400/50 dark:ring-gray-400/30',
      },
    ],
    defaultVariants: {
      color: 'neutral',
      outline: false,
    },
  }
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
        className
      )}
      {...rest}
    >
      {leftIcon && <span className="mr-1 inline-flex items-center">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-1 inline-flex items-center">{rightIcon}</span>}
    </span>
  )
}

export default Badge
