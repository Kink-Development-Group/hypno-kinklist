import React from 'react'
import { useTranslation } from 'react-i18next'
import Tooltip from './Tooltip'

interface ThemeToggleProps {
  theme: string
  toggleTheme: () => void
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  const { t } = useTranslation()
  const tooltipText =
    theme === 'light' ? t('theme.toggleDark') : t('theme.toggleLight')
  return (
    <Tooltip content={tooltipText}>
      <button
        type="button"
        id="ThemeToggle"
        onClick={toggleTheme}
        aria-label={tooltipText}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </Tooltip>
  )
}

export default ThemeToggle
