import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import enJSON from './en.json'
import zhJSON from './zh.json'

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
    // Priority: explicit stored choice -> env default -> navigator -> 'en'
    lng:
      localStorage.getItem('i18nextLng')
      || import.meta.env.VITE_DEFAULT_LANG
      || 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n
