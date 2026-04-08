import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useKinklist } from '../context/KinklistContext'
import { useErrorHandler } from '../utils/useErrorHandler'

const FixOverlay: React.FC = () => {
  const { t } = useTranslation()
  const { setIsInputOverlayOpen } = useKinklist()
  const errorHandler = useErrorHandler()

  const handleFixOverlay = useCallback(() => {
    // Setze den Modal-Status zurück
    setIsInputOverlayOpen(false)

    // Zeige Erfolgsmeldung
    errorHandler(t('fix.successMessage'))
  }, [setIsInputOverlayOpen, errorHandler, t])

  return (
    <div className="fix-overlay">
      <h2>{t('fix.title')}</h2>
      <p>{t('fix.description')}</p>{' '}
      <button className="btn" onClick={handleFixOverlay}>
        {t('fix.button')}
      </button>
    </div>
  )
}

export default FixOverlay
