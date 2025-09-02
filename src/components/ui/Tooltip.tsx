import * as RadixTooltip from '@radix-ui/react-tooltip'
import { ReactNode } from 'react'
import { cn } from '@/utils/format'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  delay?: number
  className?: string // wrapper
  contentClassName?: string // content
  maxWidth?: number | string
  minWidth?: number | string
  align?: 'start' | 'center' | 'end'
}

// WHY: Wrap Radix Tooltip so we keep our simple API and can later swap styles without changing call sites.
export function Tooltip({
  content,
  children,
  side = 'top',
  delay = 150,
  className,
  contentClassName,
  maxWidth,
  minWidth,
  align = 'center',
}: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={delay}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>
          <span className={cn('inline-flex', className)}>{children}</span>
        </RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            align={align}
            style={{
              ...(maxWidth
                ? { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }
                : { maxWidth: 'min(calc(100vw - 2rem),480px)' }),
              ...(minWidth
                ? { minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth }
                : {}),
            }}
            className={cn(
              'z-50 overflow-hidden rounded border bg-popover px-2 py-1 text-xs shadow-sm text-popover-foreground',
              'data-[state=delayed-open]:data-[side=top]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95',
              'break-words whitespace-pre-wrap',
              contentClassName
            )}
          >
            {content}
            <RadixTooltip.Arrow className="fill-popover" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}

export default Tooltip
