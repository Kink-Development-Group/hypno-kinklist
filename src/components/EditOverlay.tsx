import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useKinklist } from '../context/KinklistContext'
import { useTheme } from '../context/ThemeContext'
import {
  getAllKinks,
  hasMultilingualContent,
  parseKinksTextEnhanced,
} from '../utils'
import {
  parseEnhancedKinksText,
  resolveEnhancedKinksData,
} from '../utils/multilingualTemplates'
import { useErrorHandler } from '../utils/useErrorHandler'
import AdvancedKinkListEditor, {
  AdvancedKinkListEditorRef,
} from './editor/AdvancedKinkListEditor'

const EditOverlay: React.FC = () => {
  const {
    setKinks,
    levels,
    selection,
    setSelection,
    originalKinksText,
    setOriginalKinksText,
    isEditOverlayOpen,
    setIsEditOverlayOpen,
    setEnhancedKinks,
  } = useKinklist()
  const { t, i18n } = useTranslation()

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
      // Check if the text contains multilingual content
      const isMultilingual = hasMultilingualContent(kinksText)

      if (isMultilingual) {
        // Parse as enhanced template
        const enhancedData = parseEnhancedKinksText(kinksText, errorHandler)

        if (enhancedData) {
          setEnhancedKinks(enhancedData)
          // Resolve to current language
          const resolvedKinks = resolveEnhancedKinksData(
            enhancedData,
            i18n.language
          )
          setKinks(resolvedKinks)
          setOriginalKinksText(kinksText)

          // Create a new selection based on the updated kink structure
          const newSelection = getAllKinks(resolvedKinks, levels, selection)
          setSelection(newSelection)
        } else {
          errorHandler(
            'Failed to parse multilingual template - no data returned'
          )
          return
        }
      } else {
        // Parse as standard template
        const parsedKinks = parseKinksTextEnhanced(kinksText, errorHandler)

        if (parsedKinks) {
          setKinks(parsedKinks)
          setOriginalKinksText(kinksText)
          setEnhancedKinks(null) // Clear enhanced data for standard templates

          // Create a new selection based on the updated kink structure
          const newSelection = getAllKinks(parsedKinks, levels, selection)
          setSelection(newSelection)
          console.log('Successfully set standard template')
        } else {
          console.error('Standard parsing returned null/undefined')
          errorHandler('Failed to parse standard template - no data returned')
          return
        }
      }
    } catch (error) {
      console.error('Exception in handleAccept:', error)
      errorHandler(
        'Ein Fehler ist beim Versuch, den eingegebenen Text zu analysieren, aufgetreten. Bitte korrigieren Sie ihn und versuchen Sie es erneut.',
        error
      )
      return
    }

    console.log('Closing edit overlay...')
    setIsEditOverlayOpen(false)
  }, [
    kinksText,
    levels,
    selection,
    setKinks,
    setOriginalKinksText,
    setSelection,
    setIsEditOverlayOpen,
    setEnhancedKinks,
    i18n.language,
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
      setKinksText(originalKinksText)
    }
  }, [isEditOverlayOpen, originalKinksText])

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
