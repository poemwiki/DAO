import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/utils/format'
import type { ComponentPropsWithoutRef, ElementRef } from 'react'
import { forwardRef } from 'react'

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
      'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
      'data-[side=top]:slide-in-from-bottom-1 data-[side=bottom]:slide-in-from-top-1',
      'data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1',
      'break-words whitespace-pre-wrap',
      className,
    )}
    {...props}
  >
    {props.children}
    <TooltipPrimitive.Arrow className="fill-popover" />
  </TooltipPrimitive.Content>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

// Backwards compatible simple wrapper for previous usage pattern: <Tooltip content=...><child/></Tooltip>
import type { ReactNode } from 'react'
interface LegacyWrapperProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  maxWidth?: number | string
  minWidth?: number | string
  className?: string
  contentClassName?: string
}
function LegacyTooltip({
  content,
  children,
  side = 'top',
  align,
  maxWidth,
  minWidth,
  className,
  contentClassName,
}: LegacyWrapperProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex cursor-help', className)}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        style={{
          ...(maxWidth
            ? {
                maxWidth:
                  typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
              }
            : { maxWidth: 'min(calc(100vw - 2rem),480px)' }),
          ...(minWidth
            ? {
                minWidth:
                  typeof minWidth === 'number' ? `${minWidth}px` : minWidth,
              }
            : {}),
        }}
        className={contentClassName}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  )
}

export default LegacyTooltip
