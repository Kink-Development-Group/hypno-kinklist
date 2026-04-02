import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import deTranslation from './locales/de.json'
import enTranslation from './locales/en.json'
import svTranslation from './locales/sv.json'

const normalizeLanguageCode = (language?: string): string => {
  const normalizedLanguage = language?.split('-')[0]

  return normalizedLanguage && ['en', 'de', 'sv'].includes(normalizedLanguage)
    ? normalizedLanguage
    : 'en'
}

const syncDocumentLanguage = (language?: string): void => {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.lang = normalizeLanguageCode(
    language ?? i18n.resolvedLanguage ?? i18n.language
  )
}

const hasAccessibleLocalStorage = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const storage = window.localStorage

    if (
      typeof storage?.getItem !== 'function' ||
      typeof storage?.setItem !== 'function' ||
      typeof storage?.removeItem !== 'function'
    ) {
      return false
    }

    const probeKey = '__i18n_probe__'
    storage.setItem(probeKey, '1')
    storage.removeItem(probeKey)
    return true
  } catch {
    return false
  }
}

const canUseLocalStorage = hasAccessibleLocalStorage()

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false, // Disable debug to reduce console noise

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    resources: {
      en: {
        translation: enTranslation,
      },
      de: {
        translation: deTranslation,
      },
      sv: {
        translation: svTranslation,
      },
    },

    detection: {
      order: canUseLocalStorage
        ? ['localStorage', 'navigator', 'htmlTag']
        : ['navigator', 'htmlTag'],
      caches: canUseLocalStorage ? ['localStorage'] : [],
    },
  })

syncDocumentLanguage()
i18n.on('languageChanged', syncDocumentLanguage)

export default i18n
