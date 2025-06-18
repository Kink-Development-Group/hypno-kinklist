import React from 'react'
import { useTranslation } from 'react-i18next'

const LanguageToggle: React.FC = () => {
  const { i18n, t } = useTranslation()

  const toggleLanguage = () => {
    const currentLang = i18n.language
    const newLang = currentLang === 'en' ? 'de' : 'en'
    i18n.changeLanguage(newLang)
  }

  const getCurrentLanguageLabel = () => {
    return i18n.language === 'en' ? 'DE' : 'EN'
  }

  return (
    <button
      type="button"
      className="language-toggle"
      onClick={toggleLanguage}
      title={t('language.select')}
      aria-label={`${t('language.select')} (${getCurrentLanguageLabel()})`}
    >
      {getCurrentLanguageLabel()}
    </button>
  )
}

export default LanguageToggle
