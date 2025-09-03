import { useCallback, useRef, useState } from 'react'
import { useIsMobile } from './use-is-mobile'

export function useHoverPopover(delay = 120) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const hoverTimeout = useRef<number | null>(null)

  const openNow = useCallback(() => setOpen(true), [])
  const closeNow = useCallback(() => setOpen(false), [])

  const onOpen = useCallback(() => {
    if (isMobile) return
    if (hoverTimeout.current) window.clearTimeout(hoverTimeout.current)
    setOpen(true)
  }, [isMobile])

  const onClose = useCallback(() => {
    if (isMobile) return
    if (hoverTimeout.current) window.clearTimeout(hoverTimeout.current)
    hoverTimeout.current = window.setTimeout(() => setOpen(false), delay)
  }, [isMobile, delay])

  const toggleClick = useCallback(() => setOpen(o => !o), [])

  return { open, setOpen, onOpen, onClose, toggleClick, openNow, closeNow, isMobile }
}
