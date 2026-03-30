import React, { memo } from 'react'
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

  const handleOpenComment = (field: string) => {
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

    if (!kinkSelection) {
      const newSelection: Selection = {
        category: categoryName,
        kink: kinkName,
        field: field,
        value: Object.keys(levels)[0],
        showField: fields.length > 1,
        categoryId: stableIds.categoryId,
        kinkId: stableIds.kinkId,
        fieldId: stableIds.fieldId,
      }
      kinkSelection = newSelection
      setSelection([...selection, newSelection])
    }

    setSelectedKink(kinkSelection)
    setIsCommentOverlayOpen(true)
  }

  return (
    <tr
      className={`kinkRow kink-${strToClass(kinkName)}`}
      data-kink={kinkName}
      id={rowId}
      role="row"
      aria-labelledby={kinkNameId}
    >
      {fields.map((field) => (
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
      ))}
      <td id={kinkNameId} className="kink-name" role="cell">
        {kinkName}
        <div className="kink-actions">
          {' '}
          {fields.map((field) => {
            const stableIds = getStableIdsFromOriginal(
              enhancedKinks,
              categoryName,
              kinkName,
              field
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
                s.field === field
              )
            })

            const hasComment =
              kinkSelection?.comment && kinkSelection.comment.trim().length > 0

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
  )
}

export default memo(KinkRow)
