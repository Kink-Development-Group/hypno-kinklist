import React, {
  KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import ReactDOM from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useKinklist } from '../context/KinklistContext'
import { Selection } from '../types'
import { getStableIdsFromOriginal } from '../utils/multilingualTemplates'

interface ChoiceProps {
  field: string
  categoryName: string
  kinkName: string
}

const Choice: React.FC<ChoiceProps> = ({ field, categoryName, kinkName }) => {
  const { levels, selection, setSelection, enhancedKinks } = useKinklist()
  const { t } = useTranslation()
  const [selectedLevel, setSelectedLevel] = useState<string>(
    Object.keys(levels)[0]
  )
  const [showTooltip, setShowTooltip] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{
    top: number
    left: number
    width: number
    height: number
  }>()
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Find the current selection for this choice
  useEffect(() => {
    // Get stable IDs for consistent matching across languages
    const stableIds = getStableIdsFromOriginal(
      enhancedKinks,
      categoryName,
      kinkName,
      field
    )

    const currentSelection = selection.find((item) => {
      // First try to match by stable IDs if available
      if (item.categoryId && item.kinkId && item.fieldId) {
        return (
          item.categoryId === stableIds.categoryId &&
          item.kinkId === stableIds.kinkId &&
          item.fieldId === stableIds.fieldId
        )
      }
      // Fallback to name matching
      return (
        item.category === categoryName &&
        item.kink === kinkName &&
        item.field === field
      )
    })

    if (currentSelection) {
      setSelectedLevel(currentSelection.value)
    }
  }, [selection, categoryName, kinkName, field, enhancedKinks])

  const handleClick = useCallback(
    (levelName: string) => {
      setSelectedLevel(levelName)

      // Get stable IDs for consistent matching across languages
      const stableIds = getStableIdsFromOriginal(
        enhancedKinks,
        categoryName,
        kinkName,
        field
      )

      // Find existing selection item or create a new one
      const existingIndex = selection.findIndex((item) => {
        // First try to match by stable IDs if available
        if (item.categoryId && item.kinkId && item.fieldId) {
          return (
            item.categoryId === stableIds.categoryId &&
            item.kinkId === stableIds.kinkId &&
            item.fieldId === stableIds.fieldId
          )
        }
        // Fallback to name matching
        return (
          item.category === categoryName &&
          item.kink === kinkName &&
          item.field === field
        )
      })

      let updatedSelection: Selection[]

      if (existingIndex >= 0) {
        // Update existing selection - preserve stable IDs
        updatedSelection = selection.map((item, index) => {
          if (index === existingIndex) {
            return {
              ...item,
              value: levelName,
              // Ensure stable IDs are preserved
              categoryId: item.categoryId,
              kinkId: item.kinkId,
              fieldId: item.fieldId,
            }
          }
          return item
        })
      } else {
        // Create new selection item if it doesn't exist
        // Generate stable IDs for new items
        const stableIds = getStableIdsFromOriginal(
          enhancedKinks,
          categoryName,
          kinkName,
          field
        )

        const newItem: Selection = {
          category: categoryName,
          kink: kinkName,
          field: field,
          value: levelName,
          showField: true,
          // Set stable IDs for new items
          categoryId: stableIds.categoryId,
          kinkId: stableIds.kinkId,
          fieldId: stableIds.fieldId,
        }
        updatedSelection = [...selection, newItem]
      }

      setSelection(updatedSelection)
    },
    [categoryName, kinkName, field, selection, setSelection, enhancedKinks]
  )

  // Handled keyboard events for accessibility
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, levelName: string) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleClick(levelName)
      }
    },
    [handleClick]
  )

  // Tooltip-Positionierungslogik
  const calculateTooltipPosition = (rect: DOMRect) => {
    const viewportWidth = window.innerWidth
    const tooltipWidth = 320
    const spaceRight = viewportWidth - rect.right
    let left = rect.left + rect.width / 2 - tooltipWidth / 2
    if (spaceRight < tooltipWidth / 2 + 20) {
      left = rect.right - tooltipWidth
      if (left < 10) left = 10
    }
    if (left < 10) {
      left = rect.left
      if (left + tooltipWidth > viewportWidth - 10) {
        left = viewportWidth - tooltipWidth - 10
      }
    }
    return {
      top: rect.bottom + 6,
      left,
      width: rect.width,
      height: rect.height,
    }
  }

  // Tooltip-Handler
  const handleShowTooltip = (index: number) => {
    const btn = buttonRefs.current[index]
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    setTooltipPos(calculateTooltipPosition(rect))
    setShowTooltip(index.toString())
  }
  const handleHideTooltip = () => setShowTooltip(null)

  // Mapping von Level-Namen zu i18n-Schlüsseln (wie in Legend)
  const getLevelTranslationKey = (levelName: string): string => {
    const keyMap: Record<string, string> = {
      'Not Entered': 'legend.notEntered',
      Favorite: 'legend.favorite',
      Like: 'legend.like',
      Okay: 'legend.okay',
      Maybe: 'legend.maybe',
      No: 'legend.no',
    }
    return (
      keyMap[levelName] ||
      `legend.${levelName.toLowerCase().replace(/\s+/g, '')}`
    )
  }

  return (
    <div
      className={`choices choice-${field.toLowerCase().replace(/\s+/g, '')}`}
      data-field={field}
      role="radiogroup"
      aria-label={t('choice.selectionFor', { kinkName, field })}
    >
      {Object.entries(levels).map(([levelName, level], index) => {
        const isSelected = selectedLevel === levelName
        // Übersetze den Level-Namen für Tooltip und aria-label
        const levelTranslationKey = getLevelTranslationKey(levelName)
        let translatedLevelName = t(levelTranslationKey)
        if (translatedLevelName === levelTranslationKey)
          translatedLevelName = levelName
        return (
          <React.Fragment key={levelName}>
            <button
              ref={(el) => (buttonRefs.current[index] = el)}
              className={`choice ${level.class} ${isSelected ? 'selected' : ''}`}
              data-level={levelName}
              data-level-int={index}
              onClick={() => handleClick(levelName)}
              onKeyDown={(e) => handleKeyDown(e, levelName)}
              type="button"
              role="radio"
              aria-checked={isSelected ? true : false}
              aria-label={t('choice.levelFor', {
                levelName: translatedLevelName,
                kinkName,
                field,
              })}
              tabIndex={isSelected ? 0 : -1}
              onMouseEnter={() => handleShowTooltip(index)}
              onFocus={() => handleShowTooltip(index)}
              onMouseLeave={handleHideTooltip}
              onBlur={handleHideTooltip}
            />
            {showTooltip === index.toString() &&
              tooltipPos &&
              ReactDOM.createPortal(
                <div
                  className="kink-tooltip-text kink-tooltip-portal comment-tooltip"
                  style={
                    {
                      position: 'fixed' as const,
                      top: tooltipPos.top,
                      left: tooltipPos.left,
                      zIndex: 99999 as const,
                      '--arrow-left': tooltipPos.width
                        ? `${tooltipPos.width / 2}px`
                        : '50%',
                    } as React.CSSProperties
                  }
                  tabIndex={-1}
                  onMouseLeave={handleHideTooltip}
                >
                  {t('choice.levelFor', {
                    levelName: translatedLevelName,
                    kinkName,
                    field,
                  })}
                </div>,
                document.body
              )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default memo(Choice)
