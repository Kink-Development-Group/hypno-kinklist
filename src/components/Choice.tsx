import React, { KeyboardEvent, memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useKinklist } from '../context/KinklistContext'
import { Selection } from '../types'
import { getDefaultLevelKey } from '../utils/levels'
import { getStableIdsFromOriginal } from '../utils/multilingualTemplates'

interface ChoiceProps {
  field: string
  categoryName: string
  kinkName: string
  showField: boolean
}

const Choice: React.FC<ChoiceProps> = ({
  field,
  categoryName,
  kinkName,
  showField,
}) => {
  const { levels, selection, setSelection, enhancedKinks } = useKinklist()
  const { t } = useTranslation()

  // Get stable IDs for consistent matching across languages
  const stableIds = useMemo(
    () =>
      getStableIdsFromOriginal(enhancedKinks, categoryName, kinkName, field),
    [categoryName, enhancedKinks, field, kinkName]
  )
  const hasStableIds =
    stableIds.categoryId !== undefined &&
    stableIds.kinkId !== undefined &&
    stableIds.fieldId !== undefined

  const matchesSelection = useCallback(
    (item: Selection) => {
      const hasSelectionIds =
        item.categoryId !== undefined &&
        item.kinkId !== undefined &&
        item.fieldId !== undefined

      if (hasStableIds && hasSelectionIds) {
        return (
          item.categoryId === stableIds.categoryId &&
          item.kinkId === stableIds.kinkId &&
          item.fieldId === stableIds.fieldId
        )
      }

      return (
        item.category === categoryName &&
        item.kink === kinkName &&
        item.field === field
      )
    },
    [
      categoryName,
      field,
      hasStableIds,
      kinkName,
      stableIds.categoryId,
      stableIds.fieldId,
      stableIds.kinkId,
    ]
  )

  // Find the current selection for this choice
  const currentSelection = selection.find(matchesSelection)

  // Get the selected level directly from the selection
  const selectedLevel =
    currentSelection?.value ?? getDefaultLevelKey(levels) ?? ''

  const handleClick = useCallback(
    (levelName: string) => {
      setSelection((prevSelection) => {
        const existingIndex = prevSelection.findIndex(matchesSelection)

        if (existingIndex >= 0) {
          return prevSelection.map((item, index) => {
            if (index === existingIndex) {
              return {
                ...item,
                value: levelName,
                categoryId: item.categoryId ?? stableIds.categoryId,
                kinkId: item.kinkId ?? stableIds.kinkId,
                fieldId: item.fieldId ?? stableIds.fieldId,
              }
            }
            return item
          })
        }

        const newItem: Selection = {
          category: categoryName,
          kink: kinkName,
          field: field,
          value: levelName,
          showField,
          categoryId: stableIds.categoryId,
          kinkId: stableIds.kinkId,
          fieldId: stableIds.fieldId,
        }

        return [...prevSelection, newItem]
      })
    },
    [
      categoryName,
      kinkName,
      field,
      setSelection,
      matchesSelection,
      showField,
      stableIds,
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
        // Übersetze den Level-Namen für Tooltip und aria-label über den neuen Key
        let translatedLevelName = t(`legend.${level.key}`)
        if (translatedLevelName === `legend.${level.key}`)
          translatedLevelName = levelName
        return (
          <button
            key={`${categoryName}-${kinkName}-${field}-${levelName}`}
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
            title={t('choice.levelFor', {
              levelName: translatedLevelName,
              kinkName,
              field,
            })}
            tabIndex={isSelected ? 0 : -1}
          />
        )
      })}
    </div>
  )
}

export default memo(Choice)
