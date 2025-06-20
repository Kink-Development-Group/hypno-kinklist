import React, {
  KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useState,
} from 'react'
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
  const { levels, selection, setSelection, kinks, enhancedKinks } =
    useKinklist()
  const { t } = useTranslation()
  const [selectedLevel, setSelectedLevel] = useState<string>(
    Object.keys(levels)[0]
  )

  // Find the current selection for this choice
  useEffect(() => {
    // Get stable IDs for consistent matching across languages
    const stableIds = getStableIdsFromOriginal(
      enhancedKinks,
      kinks,
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
  }, [selection, categoryName, kinkName, field, enhancedKinks, kinks])
  const handleClick = useCallback(
    (levelName: string) => {
      setSelectedLevel(levelName)

      // Get stable IDs for consistent matching across languages
      const stableIds = getStableIdsFromOriginal(
        enhancedKinks,
        kinks,
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
          kinks,
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
    [
      categoryName,
      kinkName,
      field,
      selection,
      setSelection,
      enhancedKinks,
      kinks,
    ]
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

  return (
    <div
      className={`choices choice-${field.toLowerCase().replace(/\s+/g, '')}`}
      data-field={field}
      role="radiogroup"
      aria-label={t('choice.selectionFor', { kinkName, field })}
    >
      {Object.entries(levels).map(([levelName, level], index) => {
        const isSelected = selectedLevel === levelName
        return (
          <button
            key={levelName}
            className={`choice ${level.class} ${isSelected ? 'selected' : ''}`}
            data-level={levelName}
            data-level-int={index}
            title={t('choice.levelFor', { levelName, kinkName, field })}
            onClick={() => handleClick(levelName)}
            onKeyDown={(e) => handleKeyDown(e, levelName)}
            type="button"
            role="radio"
            aria-checked={isSelected ? true : false}
            aria-label={t('choice.levelFor', { levelName, kinkName, field })}
            tabIndex={isSelected ? 0 : -1}
          />
        )
      })}
    </div>
  )
}

export default memo(Choice)
