import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useKinklist } from '../context/KinklistContext'

const CommentOverlay: React.FC = () => {
  const { t } = useTranslation()
  const {
    selection,
    setSelection,
    isCommentOverlayOpen,
    setIsCommentOverlayOpen,
    selectedKink,
    setSelectedKink,
  } = useKinklist()

  const [comment, setComment] = useState<string>('')
  const overlayRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Close the overlay
  const handleClose = useCallback(() => {
    setIsCommentOverlayOpen(false)
    setSelectedKink(null)
  }, [setIsCommentOverlayOpen, setSelectedKink])

  // Save comment
  const handleSave = useCallback(() => {
    if (selectedKink) {
      const updatedSelection = selection.map((item) => {
        // Use stable IDs for comparison if available, fallback to translated names
        const matchesStableIds =
          selectedKink.categoryId &&
          selectedKink.kinkId &&
          selectedKink.fieldId &&
          item.categoryId === selectedKink.categoryId &&
          item.kinkId === selectedKink.kinkId &&
          item.fieldId === selectedKink.fieldId

        const matchesTranslatedNames =
          item.category === selectedKink.category &&
          item.kink === selectedKink.kink &&
          item.field === selectedKink.field

        if (matchesStableIds || matchesTranslatedNames) {
          return { ...item, comment: comment.trim() || undefined }
        }
        return item
      })

      setSelection(updatedSelection)
      handleClose()
    }
  }, [selectedKink, selection, setSelection, comment, handleClose])

  // Initialize comment when selectedKink changes
  useEffect(() => {
    if (selectedKink) {
      setComment(selectedKink.comment || '')
    }
  }, [selectedKink])

  // Focus management
  useEffect(() => {
    if (isCommentOverlayOpen && textareaRef.current) {
      // Small delay to ensure the overlay is fully rendered
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }, [isCommentOverlayOpen])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isCommentOverlayOpen) return

      // Escape key to close
      if (e.key === 'Escape') {
        handleClose()
        e.preventDefault()
      }

      // Ctrl+Enter to save
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSave()
        e.preventDefault()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isCommentOverlayOpen, handleClose, handleSave])

  // Close when clicking on the overlay background
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        handleClose()
      }
    },
    [handleClose]
  )

  if (!selectedKink) return null

  return (
    <div
      id="CommentOverlay"
      className={`overlay ${isCommentOverlayOpen ? 'visible' : ''}`}
      onClick={handleOverlayClick}
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="comment-overlay-title"
      tabIndex={-1}
    >
      <div className="comment-overlay-content modal-content">
        <button
          className="close-button"
          onClick={handleClose}
          aria-label={t('buttons.close')}
          type="button"
        >
          &times;
        </button>

        <h2 id="comment-overlay-title">{t('comments.addComment')}</h2>

        <div className="comment-kink-info">
          <div className="comment-kink-category">
            <strong>{t('comments.category')}:</strong> {selectedKink.category}
          </div>
          {selectedKink.showField && (
            <div className="comment-kink-field">
              <strong>{t('comments.field')}:</strong> {selectedKink.field}
            </div>
          )}
          <div className="comment-kink-name">
            <strong>{t('comments.kink')}:</strong> {selectedKink.kink}
          </div>
          <div className="comment-kink-value">
            <strong>{t('comments.rating')}:</strong> {selectedKink.value}
          </div>
        </div>

        <div className="comment-input-section">
          <label htmlFor="comment-textarea" className="comment-label">
            {t('comments.commentOptional')}:
          </label>
          <textarea
            id="comment-textarea"
            ref={textareaRef}
            className="comment-textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('comments.placeholder')}
            rows={6}
            maxLength={1000}
          />
          <div className="comment-char-count">
            {comment.length}/1000 {t('comments.characters')}
          </div>
        </div>

        <div className="comment-actions">
          <button
            type="button"
            className="comment-button comment-button-cancel"
            onClick={handleClose}
          >
            {t('buttons.cancel')}
          </button>
          <button
            type="button"
            className="comment-button comment-button-save"
            onClick={handleSave}
          >
            {t('buttons.save')}
          </button>
        </div>

        <div className="comment-shortcuts">
          <small>
            <kbd>Esc</kbd> {t('comments.toClose')} • <kbd>Strg</kbd>+
            <kbd>Enter</kbd> {t('comments.toSave')}
          </small>
        </div>
      </div>
    </div>
  )
}

export default memo(CommentOverlay)
