import React, { memo, useState } from 'react'
import ReactDOM from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useKinklist } from '../context/KinklistContext'
import { Selection } from '../types'
import { strToClass } from '../utils'
import { getStableIdsFromOriginal } from '../utils/multilingualTemplates'
import Choice from './Choice'
import Tooltip from './Tooltip'

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
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos] = useState<{
    top: number
    left: number
    width: number
    height: number
    arrowLeft?: number
  }>()

  // State für Kommentar-Tooltips
  const [showCommentTooltip, setShowCommentTooltip] = useState<string | null>(
    null
  )
  const [commentTooltipPos] = useState<{
    top: number
    left: number
    width: number
    height: number
    arrowLeft: number
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

  const handleTooltipHide = () => setShowTooltip(false)

  // Tooltip-Element als Portal oder Inline
  const tooltipNode =
    !forceInlineTooltip && showTooltip && tooltipPos && description
      ? ReactDOM.createPortal(
          <div
            className="kink-tooltip-text kink-tooltip-portal comment-tooltip"
            style={
              {
                position: 'fixed' as const,
                top: tooltipPos.top,
                left: tooltipPos.left,
                zIndex: 99999 as const,
                '--arrow-left': tooltipPos.arrowLeft
                  ? `${tooltipPos.arrowLeft}px`
                  : tooltipPos.width
                    ? `${tooltipPos.width / 2}px`
                    : '50%',
              } as React.CSSProperties
            }
            tabIndex={-1}
            onMouseLeave={handleTooltipHide}
          >
            {description}
          </div>,
          document.body
        )
      : null

  const handleCommentTooltipHide = () => {
    setShowCommentTooltip(null)
  }

  // Comment tooltip element as portal
  const commentTooltipNode =
    showCommentTooltip && commentTooltipPos
      ? ReactDOM.createPortal(
          <div
            id={`comment-tooltip-${categoryName}-${kinkName}-${showCommentTooltip}`}
            role="tooltip"
            className="kink-tooltip-text kink-tooltip-portal comment-tooltip"
            style={
              {
                position: 'fixed' as const,
                top: commentTooltipPos.top,
                left: commentTooltipPos.left,
                zIndex: 99999 as const,
                '--arrow-left': `${commentTooltipPos.arrowLeft}px`,
              } as React.CSSProperties
            }
            tabIndex={-1}
            onMouseLeave={handleCommentTooltipHide}
          >
            {(() => {
              const stableIds = getStableIdsFromOriginal(
                enhancedKinks,
                categoryName,
                kinkName,
                showCommentTooltip
              )
              const kinkSelection = selection.find((s) => {
                if (s.categoryId && s.kinkId && s.fieldId) {
                  return (
                    s.categoryId === stableIds.categoryId &&
                    s.kinkId === stableIds.kinkId &&
                    s.fieldId === stableIds.fieldId
                  )
                }
                return (
                  s.category === categoryName &&
                  s.kink === kinkName &&
                  s.field === showCommentTooltip
                )
              })
              return kinkSelection?.comment || ''
            })()}
          </div>,
          document.body
        )
      : null

  return (
    <>
      {tooltipNode}
      {commentTooltipNode}
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

              return hasComment ? (
                <Tooltip
                  key={`tooltip-${field}`}
                  content={kinkSelection.comment || ''}
                >
                  <button
                    key={`comment-${field}`}
                    className={`comment-button-base comment-button-small has-comment`}
                    data-has-comment="true"
                    data-comment-length={
                      kinkSelection.comment ? kinkSelection.comment.length : 0
                    }
                    onClick={() => handleOpenComment(field)}
                    aria-describedby={`comment-tooltip-${categoryName}-${kinkName}-${field}`}
                    aria-label={t('comments.forField', {
                      kinkName,
                      field,
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
                  key={`comment-${field}`}
                  className="comment-button-base comment-button-small"
                  data-has-comment="false"
                  data-comment-length={kinkSelection?.comment?.length || 0}
                  onClick={() => handleOpenComment(field)}
                  aria-label={t('comments.forField', {
                    kinkName,
                    field,
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
            })}
            {description && (
              <Tooltip key="description-tooltip" content={description}>
                <span className="kink-tooltip">
                  <span
                    className="kink-tooltip-icon"
                    tabIndex={0}
                    aria-label={t('comments.showDescription')}
                  >
                    ?
                  </span>
                </span>
              </Tooltip>
            )}
          </div>
        </td>
      </tr>
    </>
  )
}

export default memo(KinkRow)
