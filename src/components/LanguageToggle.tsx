import React from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import Tooltip from './Tooltip'

const LanguageToggle: React.FC = () => {
  const { t } = useTranslation()

  // Get available languages from i18n instance
  const languages = Object.keys(i18n.options.resources || {})

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value)
  }

  return (
    <Tooltip content={t('language.select')}>
      <select
        className="language-toggle"
        value={i18n.language}
        onChange={handleChange}
        aria-label={t('language.select')}
      >
        {languages.map((lang) => (
          <option key={lang} value={lang}>
            {t(`language.${lang}`, lang.toUpperCase())}
          </option>
        ))}
      </select>
    </Tooltip>
  )
}

export default LanguageToggle
