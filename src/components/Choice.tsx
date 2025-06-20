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

interface ChoiceProps {
  field: string
  categoryName: string
  kinkName: string
}

const Choice: React.FC<ChoiceProps> = ({ field, categoryName, kinkName }) => {
  const { levels, selection, setSelection } = useKinklist()
  const { t } = useTranslation()
  const [selectedLevel, setSelectedLevel] = useState<string>(
    Object.keys(levels)[0]
  )

  // Find the current selection for this choice
  useEffect(() => {
    const currentSelection = selection.find(
      (item) =>
        item.category === categoryName &&
        item.kink === kinkName &&
        item.field === field
    )

    if (currentSelection) {
      setSelectedLevel(currentSelection.value)
    }
  }, [selection, categoryName, kinkName, field])
  const handleClick = useCallback(
    (levelName: string) => {
      setSelectedLevel(levelName)

      // Find existing selection item or create a new one
      const existingIndex = selection.findIndex(
        (item) =>
          item.category === categoryName &&
          item.kink === kinkName &&
          item.field === field
      )

      let updatedSelection: Selection[]

      if (existingIndex >= 0) {
        // Update existing selection
        updatedSelection = selection.map((item, index) => {
          if (index === existingIndex) {
            return { ...item, value: levelName }
          }
          return item
        })
      } else {
        // Create new selection item if it doesn't exist
        const newItem = {
          category: categoryName,
          kink: kinkName,
          field: field,
          value: levelName,
          showField: true,
        }
        updatedSelection = [...selection, newItem]
      }

      setSelection(updatedSelection)
    },
    [categoryName, kinkName, field, selection, setSelection]
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
