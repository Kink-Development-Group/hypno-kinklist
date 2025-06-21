import React, { memo, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useKinklist } from '../context/KinklistContext'
import { Selection } from '../types'
import { strToClass } from '../utils'
import { getStableIdsFromOriginal } from '../utils/multilingualTemplates'
import Choice from './Choice'

interface KinkRowProps {
  categoryName: string
  kinkName: string
  fields: string[]
  description?: string
  forceInlineTooltip?: boolean // Neu: für Modals/Overlays
}

const KinkRow: React.FC<KinkRowProps> = ({
  categoryName,
  kinkName,
  fields,
  description,
  forceInlineTooltip = false,
}) => {
  const {
    selection,
    setSelection,
    levels,
    setIsCommentOverlayOpen,
    setSelectedKink,
    enhancedKinks,
  } = useKinklist()
  const { t } = useTranslation()

  const rowId = `kink-row-${strToClass(categoryName)}-${strToClass(kinkName)}`
  const kinkNameId = `kink-name-${strToClass(kinkName)}`
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState<{
    top: number
    left: number
    width: number
    height: number
  }>()

  // Handle opening comment overlay
  const handleOpenComment = (field: string) => {
    // Generate stable IDs using the language-independent method
    const stableIds = getStableIdsFromOriginal(
      enhancedKinks,
      categoryName,
      kinkName,
      field
    )

    let kinkSelection = selection.find(
      (s) =>
        s.categoryId === stableIds.categoryId &&
        s.kinkId === stableIds.kinkId &&
        s.fieldId === stableIds.fieldId
    )

    // If selection doesn't exist, create it
    if (!kinkSelection) {
      const newSelection: Selection = {
        category: categoryName,
        kink: kinkName,
        field: field,
        value: Object.keys(levels)[0], // Default to first level
        showField: true,
        categoryId: stableIds.categoryId,
        kinkId: stableIds.kinkId,
        fieldId: stableIds.fieldId,
      }
      kinkSelection = newSelection

      // Add it to the selection array
      const updatedSelection = [...selection, newSelection]
      setSelection(updatedSelection)
    }

    setSelectedKink(kinkSelection)
    setIsCommentOverlayOpen(true)
  }

  // Tooltip-Portal-Logik
  const handleTooltipShow = (_e: React.MouseEvent | React.FocusEvent) => {
    if (!tooltipRef.current) return
    const rect = tooltipRef.current.getBoundingClientRect()

    // Prüfe verfügbaren Platz und justiere Position entsprechend
    const viewportWidth = window.innerWidth
    const tooltipWidth = 320 // max-width aus CSS
    const spaceRight = viewportWidth - rect.right

    let left = rect.left

    // Wenn nicht genug Platz rechts, positioniere links vom Element
    if (spaceRight < tooltipWidth + 20) {
      left = rect.right - tooltipWidth
      // Stelle sicher, dass es nicht zu weit links geht
      if (left < 10) {
        left = 10
      }
    }

    setTooltipPos({
      top: rect.bottom + 6, // etwas Abstand nach unten
      left: left,
      width: rect.width,
      height: rect.height,
    })
    setShowTooltip(true)
  }
  const handleTooltipHide = () => setShowTooltip(false)

  // Accessibility: Tooltip per ESC schließen
  const handleTooltipKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Escape') {
      ;(e.target as HTMLElement).blur()
      setShowTooltip(false)
    }
  }

  // Tooltip-Element als Portal oder Inline
  const tooltipNode =
    !forceInlineTooltip && showTooltip && tooltipPos && description
      ? ReactDOM.createPortal(
          <div
            className="kink-tooltip-text kink-tooltip-portal"
            style={{
              position: 'fixed' as const,
              top: tooltipPos.top,
              left: tooltipPos.left,
              zIndex: 99999 as const,
            }}
            tabIndex={-1}
            onMouseLeave={handleTooltipHide}
          >
            {description}
          </div>,
          document.body
        )
      : null

  return (
    <>
      {tooltipNode}
      <tr
        className={`kinkRow kink-${strToClass(kinkName)}`}
        data-kink={kinkName}
        id={rowId}
        role="row"
        aria-labelledby={kinkNameId}
      >
        {fields.map((field) => {
          // Check if comment exists for this field
          // const kinkSelection = selection.find(
          //   (s) =>
          //     s.category === categoryName &&
          //     s.kink === kinkName &&s
          //     s.field === field,s
          // );
          // const hasComment =
          //   kinkSelection?.comment && kinkSelection.comment.trim().length > 0;

          return (
            <td
              key={field}
              role="cell"
              aria-label={t('comments.fieldFor', { field, kinkName })}
            >
              <div className="choice-container">
                <Choice
                  field={field}
                  categoryName={categoryName}
                  kinkName={kinkName}
                />
              </div>
            </td>
          )
        })}
        <td id={kinkNameId} className="kink-name" role="cell">
          {kinkName}
          <div className="kink-actions">
            {' '}
            {fields.map((field) => {
              // Check if comment exists for this field
              // Generate stable IDs for consistent matching
              const stableIds = getStableIdsFromOriginal(
                enhancedKinks,
                categoryName,
                kinkName,
                field
              )

              const kinkSelection = selection.find((s) => {
                // First try to match by stable IDs if available
                if (s.categoryId && s.kinkId && s.fieldId) {
                  return (
                    s.categoryId === stableIds.categoryId &&
                    s.kinkId === stableIds.kinkId &&
                    s.fieldId === stableIds.fieldId
                  )
                }
                // Fallback to name matching
                return (
                  s.category === categoryName &&
                  s.kink === kinkName &&
                  s.field === field
                )
              })
              const hasComment =
                kinkSelection?.comment &&
                kinkSelection.comment.trim().length > 0

              return (
                <button
                  key={`comment-${field}`}
                  className={`comment-button-small${hasComment ? ' has-comment' : ''}`}
                  onClick={() => handleOpenComment(field)}
                  aria-label={t('comments.forField', {
                    kinkName,
                    field,
                    action: hasComment
                      ? t('comments.editComment')
                      : t('comments.addComment'),
                  })}
                  title={
                    hasComment
                      ? t('comments.editComment')
                      : t('comments.addComment')
                  }
                  type="button"
                >
                  💬
                </button>
              )
            })}
            {description && (
              <span className="kink-tooltip">
                <span
                  className="kink-tooltip-icon"
                  tabIndex={0}
                  aria-label={t('comments.showDescription')}
                  onKeyDown={handleTooltipKeyDown}
                  ref={tooltipRef}
                  onMouseEnter={handleTooltipShow}
                  onFocus={handleTooltipShow}
                  onMouseLeave={handleTooltipHide}
                  onBlur={handleTooltipHide}
                >
                  ?
                </span>
                {forceInlineTooltip && (
                  <span className="kink-tooltip-text" tabIndex={-1}>
                    {description}
                  </span>
                )}
              </span>
            )}
          </div>
        </td>
      </tr>
    </>
  )
}

export default memo(KinkRow)
