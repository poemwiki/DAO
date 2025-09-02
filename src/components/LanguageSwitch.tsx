import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { IoLanguageSharp } from 'react-icons/io5'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

const dropdownAnimation = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.1, ease: 'easeOut' },
}

export default function LanguageSwitch() {
  const { i18n } = useTranslation()

  const handleLanguageChange = (value: string) => {
    console.log('Changing language to:', value)
    try {
      i18n.changeLanguage(value)
      localStorage.setItem('i18nextLng', value)
    } catch (error) {
      console.error('Error changing language:', error)
    }
  }

  return (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger
        className="w-10 h-10 p-0 justify-center [&>svg]:hidden"
        title={i18n.language === 'zh' ? '中文' : 'English'}
      >
        <motion.div
          className="flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <IoLanguageSharp className="h-4 w-4" />
        </motion.div>
      </SelectTrigger>
      <SelectContent>
        <AnimatePresence mode="wait">
          <motion.div {...dropdownAnimation}>
            <SelectItem value="en" className="cursor-pointer">
              <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.1 }}>
                English
              </motion.div>
            </SelectItem>
            <SelectItem value="zh" className="cursor-pointer">
              <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.1 }}>
                中文
              </motion.div>
            </SelectItem>
          </motion.div>
        </AnimatePresence>
      </SelectContent>
    </Select>
  )
}
