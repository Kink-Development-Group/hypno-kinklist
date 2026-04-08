import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useKinklist } from '../context/KinklistContext'
import VersionDisplay from './VersionDisplay'

const GITHUB_URL = 'https://github.com/Kink-Development-Group/hypno-kinklist'

const Footer: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { hasSavedDraft, savedDraftAt, clearSavedDraft } = useKinklist()
  const year = new Date().getFullYear()

  const formattedSavedAt = useMemo(() => {
    if (!savedDraftAt) {
      return null
    }

    const savedDate = new Date(savedDraftAt)

    if (Number.isNaN(savedDate.getTime())) {
      return null
    }

    return new Intl.DateTimeFormat(i18n.resolvedLanguage || i18n.language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(savedDate)
  }, [i18n.language, i18n.resolvedLanguage, savedDraftAt])

  return (
    <footer className="footer">
      <span className="footer-item">
        <VersionDisplay />
      </span>
      {hasSavedDraft && (
        <span className="footer-item footer-draft">
          <span className="footer-draft-text">
            {formattedSavedAt
              ? t('draft.savedAt', { date: formattedSavedAt })
              : t('draft.savedLocally')}
          </span>
          <button
            type="button"
            className="footer-inline-button"
            onClick={clearSavedDraft}
            aria-label={t('draft.clearAria')}
          >
            {t('draft.clear')}
          </button>
        </span>
      )}
      <span className="footer-item footer-link">
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </span>
      <span className="footer-item">&copy; {year}</span>
    </footer>
  )
}

export default Footer
