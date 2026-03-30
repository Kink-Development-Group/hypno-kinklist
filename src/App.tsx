import React, { Suspense, lazy } from 'react'
import { useTranslation } from 'react-i18next'
import AsyncKinklistProvider from './components/AsyncKinklistProvider'
import Export from './components/Export'
import Footer from './components/Footer'
import InputList from './components/InputList'
import LanguageToggle from './components/LanguageToggle'
import Legend from './components/Legend'
import ThemeToggle from './components/ThemeToggle'
import Tooltip from './components/Tooltip'
import { useKinklist } from './context/KinklistContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import './styles/main.scss'
import { AppErrorProvider } from './utils/useErrorHandler'

const EditOverlay = lazy(() => import('./components/EditOverlay'))
const InputOverlay = lazy(() => import('./components/InputOverlay'))
const CommentOverlay = lazy(() => import('./components/CommentOverlay'))

const OverlayLoadingFallback: React.FC<{ label: string }> = ({ label }) => {
  return (
    <div
      className="overlay visible lazy-overlay-fallback"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="loading-spinner">
        <div className="spinner-circle"></div>
        <p>{label}</p>
      </div>
    </div>
  )
}

const App: React.FC = () => {
  return (
    <AppErrorProvider>
      <ThemeProvider>
        <AsyncKinklistProvider>
          <AppContent />
        </AsyncKinklistProvider>
      </ThemeProvider>
    </AppErrorProvider>
  )
}

// Separate component to use context
const AppContent: React.FC = () => {
  const {
    setIsEditOverlayOpen,
    setIsInputOverlayOpen,
    isEditOverlayOpen,
    isInputOverlayOpen,
    isCommentOverlayOpen,
  } = useKinklist()
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
        <Tooltip content={t('buttons.edit')}>
          <button
            type="button"
            id="Edit"
            onClick={handleEditClick}
            aria-label={t('buttons.edit')}
          ></button>
        </Tooltip>
        <h1>{t('app.title')}</h1>
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
        <Tooltip content={t('buttons.start')}>
          <button
            type="button"
            id="StartBtn"
            onClick={handleStartClick}
            aria-label={t('buttons.start')}
            className="start-button"
          >
            <span className="button-label">{t('buttons.start')}</span>
          </button>
        </Tooltip>
      </div>
      <div className="grid-container">
        <div className="grid-row">
          <div className="grid-col-12">
            <InputList />
          </div>
        </div>
      </div>
      {isEditOverlayOpen && (
        <Suspense
          fallback={<OverlayLoadingFallback label={t('common.loading')} />}
        >
          <EditOverlay />
        </Suspense>
      )}
      {isInputOverlayOpen && (
        <Suspense
          fallback={<OverlayLoadingFallback label={t('common.loading')} />}
        >
          <InputOverlay />
        </Suspense>
      )}
      {isCommentOverlayOpen && (
        <Suspense
          fallback={<OverlayLoadingFallback label={t('common.loading')} />}
        >
          <CommentOverlay />
        </Suspense>
      )}
      <Footer />
    </div>
  )
}

export default App
