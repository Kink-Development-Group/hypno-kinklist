import React from 'react'
import { useTranslation } from 'react-i18next'

interface ErrorModalProps {
  message: string
  onClose: () => void
}

const ErrorModal: React.FC<ErrorModalProps> = ({ message, onClose }) => {
  const { t } = useTranslation()

  return (
    <div className="overlay visible" role="alertdialog" aria-modal="true">
      <div className="modal-content error-modal">
        <h2>{t('error.title')}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose} autoFocus>
            {t('buttons.close')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorModal
