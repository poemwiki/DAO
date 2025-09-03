import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { IoLanguageSharp } from 'react-icons/io5'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/utils/format'
import { useHoverPopover } from '@/hooks/use-hover-popover'
import { t } from 'i18next'
import { Button } from './ui/button'
import { dropdownAnimation } from '@/animations/dropdown'

export default function LanguageSwitch() {
  const { i18n } = useTranslation()
  const {
    open,
    setOpen,
    onOpen: openDelayed,
    onClose: closeDelayed,
    isMobile,
  } = useHoverPopover(120)

  const handleLanguageChange = (value: string) => {
    try {
      i18n.changeLanguage(value)
      localStorage.setItem('i18nextLng', value)
      if (!isMobile) setOpen(false)
    } catch (error) {
      console.error('Error changing language:', error)
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
            'w-10 h-10 inline-flex items-center justify-center rounded-md border bg-background hover:bg-accent/40 transition-colors outline-none'
          )}
          title={t('switchLanguage.menuTitle')}
        >
          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <IoLanguageSharp className="h-4 w-4" />
          </motion.div>
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Content
        sideOffset={6}
        onMouseEnter={openDelayed}
        onMouseLeave={closeDelayed}
        onOpenAutoFocus={e => e.preventDefault()}
        className={cn(
          'z-50 w-fit origin-[var(--radix-popover-content-transform-origin)] rounded-md border bg-popover p-1 text-popover-foreground shadow-md focus:outline-none',
          'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
        )}
      >
        <AnimatePresence mode="wait">
          {open && (
            <motion.ul {...dropdownAnimation} className="flex flex-col gap-0.5 text-sm">
              <li>
                <Button
                  onClick={() => handleLanguageChange('en')}
                  className={cn(
                    'w-full h-10 rounded-sm bg-transparent px-2 text-left transition-colors',
                    i18n.language === 'en' && 'bg-accent'
                  )}
                >
                  English
                </Button>
              </li>
              <li>
                <Button
                  onClick={() => handleLanguageChange('zh')}
                  className={cn(
                    'w-full h-10 rounded-sm bg-transparent px-2 text-left transition-colors',
                    i18n.language === 'zh' && 'bg-accent'
                  )}
                >
                  中文
                </Button>
              </li>
            </motion.ul>
          )}
        </AnimatePresence>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  )
}
