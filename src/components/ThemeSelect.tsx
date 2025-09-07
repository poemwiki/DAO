import * as PopoverPrimitive from '@radix-ui/react-popover'
import { AnimatePresence, motion } from 'framer-motion'
import { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MdOutlineComputer,
  MdOutlineDarkMode,
  MdOutlineLightMode,
} from 'react-icons/md'
import { dropdownAnimation } from '@/animations/dropdown'
import { useHoverPopover } from '@/hooks/use-hover-popover'
import { cn } from '@/utils/format'
import { Button } from './ui/button'

// Theme type
type Theme = 'light' | 'dark' | 'system'

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  }
  catch {}
  return 'system'
}

export default function ThemeSelect() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme())
  const { t } = useTranslation()

  useLayoutEffect(() => {
    const root = document.documentElement
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const finalTheme = theme === 'system' ? (sysDark ? 'dark' : 'light') : theme
    root.classList.remove('light', 'dark')
    root.classList.add(finalTheme)
    localStorage.setItem('theme', theme)

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => {
        const updated = mq.matches ? 'dark' : 'light'
        root.classList.remove('light', 'dark')
        root.classList.add(updated)
      }
      mq.addEventListener('change', listener)
      return () => mq.removeEventListener('change', listener)
    }
  }, [theme])

  const iconMap: Record<Theme, JSX.Element> = {
    light: <MdOutlineLightMode className="h-4 w-4" />,
    dark: <MdOutlineDarkMode className="h-4 w-4" />,
    system: <MdOutlineComputer className="h-4 w-4" />,
  }

  const {
    open,
    setOpen,
    onOpen: openDelayed,
    onClose: closeDelayed,
    isMobile,
  } = useHoverPopover(120)

  const selectTheme = (val: Theme) => {
    setTheme(val)
    if (!isMobile) {
      setOpen(false)
    }
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          onMouseEnter={openDelayed}
          onMouseLeave={closeDelayed}
          className={cn(
            'w-10 h-10 inline-flex items-center justify-center rounded-md border bg-background hover:bg-accent/40 transition-colors outline-none',
          )}
          title={t('theme.menuTitle')}
        >
          <motion.div
            key={theme}
            className="flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {iconMap[theme]}
          </motion.div>
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Content
        sideOffset={6}
        onMouseEnter={openDelayed}
        onMouseLeave={closeDelayed}
        onOpenAutoFocus={e => e.preventDefault()}
        className={cn(
          'z-50 w-auto origin-[var(--radix-popover-content-transform-origin)] rounded-md border bg-popover p-0 text-popover-foreground shadow-md focus:outline-none',
          'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        )}
      >
        <AnimatePresence mode="wait">
          {open && (
            <motion.ul
              {...dropdownAnimation}
              className="flex flex-col gap-0.5 text-sm min-w-[2.25rem] items-center"
            >
              <li>
                <Button
                  onClick={() => selectTheme('light')}
                  className={cn(
                    'w-10 h-10 bg-transparent rounded-md transition-colors',
                    theme === 'light' && 'bg-accent',
                  )}
                  title={t('theme.light')}
                  aria-label={t('theme.light')}
                >
                  <MdOutlineLightMode className="h-4 w-4" />
                </Button>
              </li>
              <li>
                <Button
                  onClick={() => selectTheme('dark')}
                  className={cn(
                    'w-10 h-10 bg-transparent rounded-md transition-colors',
                    theme === 'dark' && 'bg-accent',
                  )}
                  title={t('theme.dark')}
                  aria-label={t('theme.dark')}
                >
                  <MdOutlineDarkMode className="h-4 w-4" />
                </Button>
              </li>
              <li>
                <Button
                  onClick={() => selectTheme('system')}
                  className={cn(
                    'w-10 h-10 bg-transparent rounded-md transition-colors',
                    theme === 'system' && 'bg-accent',
                  )}
                  title={t('theme.system')}
                  aria-label={t('theme.system')}
                >
                  <MdOutlineComputer className="h-4 w-4" />
                </Button>
              </li>
            </motion.ul>
          )}
        </AnimatePresence>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  )
}
