import React from 'react'
import { useTranslation } from 'react-i18next'
import CommentOverlay from './components/CommentOverlay'
import EditOverlay from './components/EditOverlay'
import Export from './components/Export'
import I18nKinklistProvider from './components/I18nKinklistProvider'
import InputList from './components/InputList'
import InputOverlay from './components/InputOverlay'
import LanguageToggle from './components/LanguageToggle'
import Legend from './components/Legend'
import ThemeToggle from './components/ThemeToggle'
import VersionDisplay from './components/VersionDisplay'
import { useKinklist } from './context/KinklistContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import './styles/main.scss'

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <I18nKinklistProvider useEnhancedTemplate={true}>
        <AppContent />
      </I18nKinklistProvider>
    </ThemeProvider>
  )
}

// Separate component to use context
const AppContent: React.FC = () => {
  const { setIsEditOverlayOpen, setIsInputOverlayOpen } = useKinklist()
  const { theme, toggleTheme } = useTheme()
  const { t } = useTranslation()

  const handleEditClick = () => {
    setIsEditOverlayOpen(true)
  }
  const handleStartClick = () => {
    setIsInputOverlayOpen(true)
  }

  return (
    <div className="container" data-theme={theme}>
      <div className="header-controls">
        <button
          type="button"
          title={t('buttons.edit')}
          id="Edit"
          onClick={handleEditClick}
          aria-label={t('buttons.edit')}
        ></button>
        <h1>
          {t('app.title')} <VersionDisplay />
        </h1>
        <div className="header-actions">
          <LanguageToggle />
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
      </div>
      <Legend />
      <div className="action-buttons-container">
        <div className="export-container">
          <Export />
        </div>

        <button
          type="button"
          title={t('buttons.start')}
          id="StartBtn"
          onClick={handleStartClick}
          aria-label={t('buttons.start')}
          className="start-button"
        >
          <span className="button-label">{t('buttons.start')}</span>
        </button>
      </div>{' '}
      <div className="grid-container">
        <div className="grid-row">
          <div className="grid-col-12">
            <InputList />
          </div>
        </div>
      </div>
      <EditOverlay />
      <InputOverlay />
      <CommentOverlay />
    </div>
  )
}

export default App
