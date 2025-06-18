import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useKinklist } from '../context/KinklistContext'
import { useTheme } from '../context/ThemeContext'
import { getAllKinks, kinksToText, parseKinksText } from '../utils'
import { useErrorHandler } from '../utils/useErrorHandler'
import AdvancedKinkListEditor, {
  AdvancedKinkListEditorRef,
} from './editor/AdvancedKinkListEditor'

const EditOverlay: React.FC = () => {
  const {
    kinks,
    setKinks,
    levels,
    selection,
    setSelection,
    originalKinksText,
    setOriginalKinksText,
    isEditOverlayOpen,
    setIsEditOverlayOpen,
  } = useKinklist()
  const { t } = useTranslation()

  const [kinksText, setKinksText] = useState<string>(originalKinksText)
  const editorRef = useRef<AdvancedKinkListEditorRef>(null)
  const errorHandler = useErrorHandler()
  const { theme } = useTheme()

  // Focus management & Body-Scroll-Lock für mobiles Overlay
  useEffect(() => {
    if (isEditOverlayOpen) {
      // Fokus auf Editor setzen
      if (editorRef.current) {
        editorRef.current.focus()
      }
      // Body-Scroll verhindern (z.B. auf Mobilgeräten)
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      // Body-Scroll wieder erlauben
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    // Cleanup falls Komponente unmounted wird
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [isEditOverlayOpen])

  const handleClose = useCallback(() => {
    setIsEditOverlayOpen(false)
  }, [setIsEditOverlayOpen])

  const handleAccept = useCallback(() => {
    try {
      const parsedKinks = parseKinksText(kinksText)
      if (parsedKinks) {
        // Create a new selection based on the updated kink structure
        const newSelection = getAllKinks(parsedKinks, levels, selection)

        setKinks(parsedKinks)
        setOriginalKinksText(kinksText)
        setSelection(newSelection)
      }
    } catch (error) {
      errorHandler(
        'Ein Fehler ist beim Versuch, den eingegebenen Text zu analysieren, aufgetreten. Bitte korrigieren Sie ihn und versuchen Sie es erneut.',
        error
      )
      return
    }

    setIsEditOverlayOpen(false)
  }, [
    kinksText,
    levels,
    selection,
    setKinks,
    setOriginalKinksText,
    setSelection,
    setIsEditOverlayOpen,
    errorHandler,
  ])

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        handleClose()
      }
    },
    [handleClose]
  )

  // Keyboard event handlers
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Escape key to close overlay
      if (e.key === 'Escape') {
        handleClose()
      }

      // Ctrl+Enter to accept changes
      if (e.key === 'Enter' && e.ctrlKey) {
        handleAccept()
      }
    },
    [handleClose, handleAccept]
  )

  // Ensure the textarea has the current kinksText when opened
  useEffect(() => {
    if (isEditOverlayOpen) {
      setKinksText(kinksToText(kinks))
    }
  }, [isEditOverlayOpen, kinks])

  return (
    <div
      id="EditOverlay"
      className={`overlay ${isEditOverlayOpen ? 'visible' : ''}`}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-overlay-title"
    >
      <div role="document" className="edit-overlay-content">
        <h2 id="edit-overlay-title" className="sr-only edit-overlay-title">
          {t('editor.title')}
        </h2>
        <AdvancedKinkListEditor
          ref={editorRef}
          initialValue={kinksText}
          onChange={setKinksText}
          height="400px"
          placeholder={t('editor.placeholder')}
          theme={theme}
          showValidation={true}
        />
        <div className="edit-overlay-actions">
          <button
            id="KinksOK"
            onClick={handleAccept}
            type="button"
            aria-label={t('buttons.save')}
          >
            {t('buttons.save')}
          </button>
          <button
            onClick={handleClose}
            type="button"
            aria-label={t('buttons.cancel')}
          >
            {t('buttons.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(EditOverlay)
