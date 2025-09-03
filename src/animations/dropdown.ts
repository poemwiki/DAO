// Shared dropdown (popover) animation variants
// Keep duration consistent across language & theme selectors
export const dropdownAnimation = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.3, ease: 'easeOut' },
} as const
