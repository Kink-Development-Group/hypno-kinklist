import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useKinklist } from '../context/KinklistContext'
import { Selection } from '../types'
import { calculateTooltipPosition } from '../utils/tooltipPosition'
import Tooltip from './Tooltip'

const InputOverlay: React.FC = () => {
  const {
    selection,
    setSelection,
    levels,
    isInputOverlayOpen,
    setIsInputOverlayOpen,
    popupIndex,
    setPopupIndex,
    kinks,
    setIsCommentOverlayOpen,
    setSelectedKink,
  } = useKinklist()
  const { t } = useTranslation()

  const [previousKinks, setPreviousKinks] = useState<React.ReactNode[]>([])
  const [nextKinks, setNextKinks] = useState<React.ReactNode[]>([])
  const [currentKink, setCurrentKink] = useState<Selection | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // State für Tooltip-Anzeige im Modal
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<'right' | 'left'>(
    'right'
  )
  const tooltipRef = useRef<HTMLSpanElement>(null)

  // State für Kommentar-Tooltips im Modal
  const [showCommentTooltip, setShowCommentTooltip] = useState(false)
  const [commentTooltipPos, setCommentTooltipPos] = useState<{
    top: number
    left: number
    width: number
    height: number
    arrowLeft: number
  }>()

  // Tooltip-Positionierungslogik für Beschreibung (wie in KinkRow)
  const [descTooltipPos, setDescTooltipPos] = useState<{
    top: number
    left: number
    width: number
    height: number
    arrowLeft: number
  }>()

  // Handle Tooltip anzeigen mit Positionsberechnung
  const handleShowTooltip = useCallback(
    (
      e: React.MouseEvent<HTMLSpanElement> | React.FocusEvent<HTMLSpanElement>
    ) => {
      setShowTooltip(true)
    },
    []
  )

  // Handle Tooltip verstecken
  const handleHideTooltip = useCallback(() => {
    setShowTooltip(false)
  }, [])

  // Number of kinks to show in previous/next sections
  const numPrev = 3
  const numNext = 3

  // Close the overlay
  const handleClose = useCallback(() => {
    setIsInputOverlayOpen(false)
  }, [setIsInputOverlayOpen])

  // Handle opening comment overlay
  const handleOpenComment = useCallback(() => {
    if (currentKink) {
      setSelectedKink(currentKink)
      setIsCommentOverlayOpen(true)
    }
  }, [currentKink, setSelectedKink, setIsCommentOverlayOpen])

  // Focus management - focus the overlay when it opens
  useEffect(() => {
    if (isInputOverlayOpen && overlayRef.current) {
      overlayRef.current.focus()
    }
  }, [isInputOverlayOpen])

  // Handle showing previous kink
  const handleShowPrev = useCallback(
    (skip = 1) => {
      const newIndex = (popupIndex - skip + selection.length) % selection.length
      setPopupIndex(newIndex)
    },
    [popupIndex, selection.length, setPopupIndex]
  )

  // Handle showing next kink
  const handleShowNext = useCallback(
    (skip = 1) => {
      const newIndex = (popupIndex + skip) % selection.length
      setPopupIndex(newIndex)
    },
    [popupIndex, selection.length, setPopupIndex]
  )

  // Handle level change for current kink
  const handleLevelChange = useCallback(
    (levelName: string) => {
      // Update the kink value
      if (currentKink) {
        // Update the selection in the context
        const updatedSelection = selection.map((item) => {
          // Use stable IDs for matching if available
          if (
            currentKink.categoryId &&
            currentKink.kinkId &&
            currentKink.fieldId
          ) {
            if (
              item.categoryId === currentKink.categoryId &&
              item.kinkId === currentKink.kinkId &&
              item.fieldId === currentKink.fieldId
            ) {
              return {
                ...item,
                value: levelName,
                // Ensure stable IDs are preserved
                categoryId: item.categoryId,
                kinkId: item.kinkId,
                fieldId: item.fieldId,
              }
            }
          } else {
            // Fallback to name matching
            if (
              item.category === currentKink.category &&
              item.kink === currentKink.kink &&
              item.field === currentKink.field
            ) {
              return {
                ...item,
                value: levelName,
                // Ensure stable IDs are preserved
                categoryId: item.categoryId,
                kinkId: item.kinkId,
                fieldId: item.fieldId,
              }
            }
          }
          return item
        })

        // Update current kink
        setCurrentKink({
          ...currentKink,
          value: levelName,
        })

        // Update global selection
        setSelection(updatedSelection)

        // Move to next kink
        setPopupIndex((current) => (current + 1) % selection.length)
      }
    },
    [currentKink, selection, setSelection, setPopupIndex]
  )

  // Create a kink element for the primary view
  const generatePrimary = useCallback(
    (kink: Selection) => {
      if (!kink) return null

      return (
        <div
          key={`${kink.category}-${kink.kink}-${kink.field}`}
          role="radiogroup"
          aria-label={t('input.title')}
        >
          {Object.entries(levels).map(([levelName, level], index) => {
            const isSelected = kink.value === levelName

            return (
              <div
                key={levelName}
                className={`big-choice ${isSelected ? 'selected' : ''}`}
                onClick={() => handleLevelChange(levelName)}
                role="radio"
                aria-checked={isSelected ? 'true' : 'false'}
                tabIndex={isSelected ? 0 : -1}
              >
                <span className={`choice ${level.class}`} aria-hidden="true" />
                {levelName}
                <span className="btn-num-text" aria-hidden="true">
                  {index}
                </span>
              </div>
            )
          })}
        </div>
      )
    },
    [levels, handleLevelChange, t]
  )

  // Create a kink element for the secondary (previous/next) view
  const generateSecondary = useCallback(
    (kink: Selection, index: number, onClick: () => void) => {
      if (!kink) return null

      return (
        <div
          key={`${kink.category}-${kink.kink}-${kink.field}-${index}`}
          className="kink-simple"
          onClick={onClick}
          role="button"
          tabIndex={0}
          aria-label={`Zu Kink ${kink.kink} gehen`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onClick()
            }
          }}
        >
          <span
            className={`choice ${levels[kink.value]?.class}`}
            aria-hidden="true"
          />
          <span className="txt-category">{kink.category}</span>
          {kink.showField && <span className="txt-field">{kink.field}</span>}
          <span className="txt-kink">{kink.kink}</span>
        </div>
      )
    },
    [levels]
  )

  // Close when clicking on the overlay background
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        handleClose()
      }
    },
    [handleClose]
  )

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isInputOverlayOpen) return
      if (e.altKey || e.shiftKey || e.ctrlKey) return

      // Up arrow - previous
      if (e.key === 'ArrowUp') {
        handleShowPrev()
        e.preventDefault()
      }

      // Down arrow - next
      if (e.key === 'ArrowDown') {
        handleShowNext()
        e.preventDefault()
      }

      // Number keys 0-5 for quick selection
      const num = parseInt(e.key)
      if (!isNaN(num) && num >= 0 && num <= 5) {
        const levelNames = Object.keys(levels)
        if (num < levelNames.length) {
          handleLevelChange(levelNames[num])
        }
      }

      // Escape key to close the overlay
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    isInputOverlayOpen,
    levels,
    handleShowPrev,
    handleShowNext,
    handleLevelChange,
    handleClose,
  ])

  // Update content when popup index changes
  useEffect(() => {
    if (!selection.length) return

    // Get current kink
    const current = selection[popupIndex]
    setCurrentKink(current)

    // Get previous kinks
    const prev: (React.ReactNode | null)[] = []
    for (let i = numPrev; i > 0; i--) {
      const prevIndex = (popupIndex - i + selection.length) % selection.length
      const prevKink = selection[prevIndex]

      prev.push(generateSecondary(prevKink, i, () => handleShowPrev(i)))
    }
    setPreviousKinks(prev)

    // Get next kinks
    const next: (React.ReactNode | null)[] = []
    for (let i = 1; i <= numNext; i++) {
      const nextIndex = (popupIndex + i) % selection.length
      const nextKink = selection[nextIndex]

      next.push(generateSecondary(nextKink, i, () => handleShowNext(i)))
    }
    setNextKinks(next)
  }, [
    popupIndex,
    selection,
    numPrev,
    numNext,
    generateSecondary,
    handleShowPrev,
    handleShowNext,
  ])

  // Handle comment tooltip show in modal
  const handleCommentTooltipShow = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect2 = (e.currentTarget as HTMLElement).getBoundingClientRect()
      setCommentTooltipPos(
        calculateTooltipPosition(rect2, 'comment-button-base')
      )
      setShowCommentTooltip(true)
    },
    []
  )

  // Handle comment tooltip show for focus events in modal
  const handleCommentTooltipShowFocus = useCallback(
    (e: React.FocusEvent<HTMLButtonElement>) => {
      const rect2 = (e.currentTarget as HTMLElement).getBoundingClientRect()
      setCommentTooltipPos(
        calculateTooltipPosition(rect2, 'comment-button-base')
      )
      setShowCommentTooltip(true)
    },
    []
  )

  const handleCommentTooltipHide = useCallback(() => {
    setShowCommentTooltip(false)
  }, [])

  // Comment tooltip element as portal for modal
  const commentTooltipNode =
    showCommentTooltip && commentTooltipPos && currentKink?.comment
      ? ReactDOM.createPortal(
          <div
            className="kink-tooltip-text kink-tooltip-portal comment-tooltip"
            style={
              {
                position: 'fixed' as const,
                top: commentTooltipPos.top,
                left: commentTooltipPos.left,
                zIndex: 99999 as const,
                '--arrow-left': commentTooltipPos.arrowLeft
                  ? `${commentTooltipPos.arrowLeft}px`
                  : commentTooltipPos.width
                    ? `${commentTooltipPos.width / 2}px`
                    : '50%',
              } as React.CSSProperties
            }
            tabIndex={-1}
            onMouseLeave={handleCommentTooltipHide}
          >
            {currentKink.comment}
          </div>,
          document.body
        )
      : null

  // Handle Tooltip anzeigen für Beschreibung
  const handleShowDescTooltip = useCallback(
    (
      e: React.MouseEvent<HTMLSpanElement> | React.FocusEvent<HTMLSpanElement>
    ) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      setDescTooltipPos(calculateTooltipPosition(rect, 'kink-tooltip-icon'))
      setShowTooltip(true)
    },
    []
  )

  if (!currentKink) return null

  return (
    <>
      {commentTooltipNode}
      <div
        id="InputOverlay"
        className={`overlay ${isInputOverlayOpen ? 'visible' : ''}`}
        onClick={handleOverlayClick}
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-label="Kink-Auswahl"
        tabIndex={-1}
      >
        <div className="widthWrapper" role="region">
          <div id="InputPrevious" aria-label="Vorherige Kinks">
            {previousKinks}
          </div>
          <div id="InputCurrent" aria-live="polite">
            <h2 id="InputCategory">{currentKink.category}</h2>
            <h3 id="InputField" className="input-kink-with-tooltip">
              {currentKink.showField ? `(${currentKink.field}) ` : ''}
              <span>{currentKink.kink}</span>

              {/* Kommentar-Button */}
              {(() => {
                const hasComment =
                  currentKink.comment && currentKink.comment.trim().length > 0
                return hasComment ? (
                  <Tooltip content={currentKink.comment || ''}>
                    <button
                      className={`comment-button-base modal-comment-button has-comment`}
                      data-has-comment="true"
                      data-comment-length={
                        currentKink.comment ? currentKink.comment.length : 0
                      }
                      onClick={handleOpenComment}
                      aria-label={t('comments.forField', {
                        kinkName: currentKink.kink,
                        field: currentKink.field,
                        action: t('comments.showComment'),
                      })}
                      type="button"
                    >
                      <span className="comment-icon">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                        </svg>
                      </span>
                    </button>
                  </Tooltip>
                ) : (
                  <button
                    className="comment-button-base modal-comment-button"
                    data-has-comment="false"
                    data-comment-length={currentKink.comment?.length || 0}
                    onClick={handleOpenComment}
                    aria-label={t('comments.forField', {
                      kinkName: currentKink.kink,
                      field: currentKink.field,
                      action: t('comments.addComment'),
                    })}
                    type="button"
                  >
                    <span className="comment-icon">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                      </svg>
                    </span>
                  </button>
                )
              })()}

              {/* Tooltip für Beschreibung, falls vorhanden */}
              {(() => {
                const cat = kinks[currentKink.category]
                const kinkIdx = cat?.kinks?.indexOf(currentKink.kink)
                const description =
                  cat &&
                  kinkIdx !== undefined &&
                  kinkIdx >= 0 &&
                  cat.descriptions &&
                  cat.descriptions[kinkIdx]
                    ? cat.descriptions[kinkIdx]
                    : undefined
                if (description) {
                  return (
                    <Tooltip content={description}>
                      <span className="kink-tooltip kink-tooltip-overlay">
                        <span
                          className="kink-tooltip-icon"
                          tabIndex={0}
                          aria-label="Beschreibung anzeigen"
                        >
                          ?
                        </span>
                      </span>
                    </Tooltip>
                  )
                }
                return null
              })()}
            </h3>
            <button
              className="closePopup"
              onClick={handleClose}
              aria-label={t('input.actions.close')}
            >
              &times;
            </button>
            <div id="InputValues">{generatePrimary(currentKink)}</div>
          </div>
          <div id="InputNext" aria-label="Nächste Kinks">
            {nextKinks}
          </div>
        </div>
      </div>
    </>
  )
}

export default memo(InputOverlay)
