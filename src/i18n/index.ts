import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import zhJSON from '@/assets/zh.json'
import enJSON from '@/assets/en.json'

const resources = {
  zh: {
    translation: zhJSON,
  },
  en: {
    translation: enJSON,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
