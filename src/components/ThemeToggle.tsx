import React from 'react'
import { useTranslation } from 'react-i18next'

interface ThemeToggleProps {
  theme: string
  toggleTheme: () => void
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      id="ThemeToggle"
      onClick={toggleTheme}
      title={theme === 'light' ? t('theme.toggleDark') : t('theme.toggleLight')}
      aria-label={
        theme === 'light' ? t('theme.toggleDark') : t('theme.toggleLight')
      }
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}

export default ThemeToggle
