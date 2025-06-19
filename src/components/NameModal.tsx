import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

interface NameModalProps {
  open: boolean
  onSubmit: (name: string) => void
  onClose: () => void
}

const NameModal: React.FC<NameModalProps> = ({ open, onSubmit, onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputRef.current) {
      onSubmit(inputRef.current.value)
    }
  }

  if (!open) return null

  return (
    <div className="overlay visible" role="dialog" aria-modal="true">
      <div className="modal-content name-modal">
        <h2>{t('name.title')}</h2>
        <form onSubmit={handleSubmit} autoComplete="off">
          <input
            ref={inputRef}
            type="text"
            placeholder={t('name.placeholder')}
            maxLength={40}
            aria-label={t('name.label')}
            className="modal-input"
            autoFocus
          />
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              {t('buttons.cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('buttons.continue')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NameModal
