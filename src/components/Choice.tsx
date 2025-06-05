import React, {
  useEffect,
  useState,
  useCallback,
  memo,
  KeyboardEvent,
} from 'react'
import { useKinklist } from '../context/KinklistContext'

interface ChoiceProps {
  field: string
  categoryName: string
  kinkName: string
}

const Choice: React.FC<ChoiceProps> = ({ field, categoryName, kinkName }) => {
  const { levels, selection, setSelection } = useKinklist()
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

      // Update the global selection state
      const updatedSelection = selection.map((item) => {
        if (
          item.category === categoryName &&
          item.kink === kinkName &&
          item.field === field
        ) {
          return { ...item, value: levelName }
        }
        return item
      })

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
      aria-label={`Auswahl für ${kinkName} (${field})`}
    >
      {Object.entries(levels).map(([levelName, level], index) => {
        const isSelected = selectedLevel === levelName
        return (
          <button
            key={levelName}
            className={`choice ${level.class} ${isSelected ? 'selected' : ''}`}
            data-level={levelName}
            data-level-int={index}
            title={`${levelName} für ${kinkName} (${field})`}
            onClick={() => handleClick(levelName)}
            onKeyDown={(e) => handleKeyDown(e, levelName)}
            type="button"
            role="radio"
            aria-checked={isSelected ? true : false}
            aria-label={`${levelName} für ${kinkName} (${field})`}
            tabIndex={isSelected ? 0 : -1}
          />
        )
      })}
    </div>
  )
}

export default memo(Choice)
