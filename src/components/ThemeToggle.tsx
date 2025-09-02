import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MdOutlineLightMode, MdOutlineDarkMode } from 'react-icons/md'
import { Button } from '@/components/ui/button'

type Theme = 'light' | 'dark' | 'system'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    // Get theme from localStorage or default to system
    const storedTheme = localStorage.getItem('theme') as Theme
    if (storedTheme) {
      setTheme(storedTheme)
    } else {
      setTheme('system')
    }
  }, [])

  useEffect(() => {
    const root = window.document.documentElement

    const applyTheme = (theme: Theme) => {
      root.classList.remove('light', 'dark')

      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        root.classList.add(systemTheme)
      } else {
        root.classList.add(theme)
      }
    }

    applyTheme(theme)
    localStorage.setItem('theme', theme)

    // Listen for system theme changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => applyTheme('system')

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    setTheme(nextTheme)
  }

  const getIcon = () => {
    if (theme === 'system') {
      // Show current system preference icon
      const isDarkSystem = window.matchMedia('(prefers-color-scheme: dark)').matches
      return isDarkSystem ? (
        <MdOutlineDarkMode className="h-4 w-4" />
      ) : (
        <MdOutlineLightMode className="h-4 w-4" />
      )
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
