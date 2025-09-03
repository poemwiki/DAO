import { useLayoutEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MdOutlineLightMode, MdOutlineDarkMode, MdOutlineComputer } from 'react-icons/md'
import { Button } from '@/components/ui/button'

type Theme = 'light' | 'dark' | 'system'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system'
    const stored = localStorage.getItem('theme') as Theme | null
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
  })

  // Apply theme asap after commit (still relies on early inline script for first paint)
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

  const toggleTheme = () => {
    // keep 3-state cycle
    setTheme(prev => (prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light'))
  }

  const getIcon = () => {
    if (theme === 'system') {
      return <MdOutlineComputer className="h-4 w-4" />
    }
    return theme === 'dark' ? (
      <MdOutlineDarkMode className="h-4 w-4" />
    ) : (
      <MdOutlineLightMode className="h-4 w-4" />
    )
  }

  const getTooltip = () => {
    switch (theme) {
      case 'light':
        return '浅色模式'
      case 'dark':
        return '深色模式'
      case 'system':
        return '跟随系统'
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="w-10 h-10 p-0 shadow-none"
      title={getTooltip()}
    >
      <motion.div
        key={theme}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {getIcon()}
      </motion.div>
    </Button>
  )
}
