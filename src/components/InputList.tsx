import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useKinklist } from '../context/KinklistContext'
import KinkCategory from './KinkCategory'

const InputList: React.FC = () => {
  const { kinks } = useKinklist()
  const { t } = useTranslation()
  const [columnCount, setColumnCount] = useState<number>(1)

  // Calculate column count based on screen width
  useEffect(() => {
    const calculateColumns = () => {
      const numCols = Math.floor((window.innerWidth - 20) / 400)
      return Math.min(Math.max(numCols, 1), 4) // Zwischen 1 und 4 Spalten
    }

    const handleResize = () => {
      setColumnCount(calculateColumns())
    }

    // Initial calculation
    handleResize()

    // Add resize event listener
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const columns = useMemo(() => {
    if (Object.keys(kinks).length === 0 || columnCount <= 0) {
      return []
    }

    // Estimate heights of categories based on number of rows
    const categoryEstimates: Record<string, number> = {}
    Object.entries(kinks).forEach(([catName, category]) => {
      // Estimated height = table header + kinks * row height + some margin
      categoryEstimates[catName] = 40 + category.kinks.length * 30 + 20
    }) // Distribute categories into columns
    const newColumns: string[][] = Array(columnCount)
      .fill(null)
      .map(() => [])
    const columnHeights: number[] = Array(columnCount).fill(0)

    Object.keys(kinks).forEach((catName) => {
      // Find column with minimum height
      const minHeightColIndex = columnHeights.indexOf(
        Math.min(...columnHeights)
      )

      // Add category to that column
      newColumns[minHeightColIndex].push(catName)

      // Update column height
      columnHeights[minHeightColIndex] += categoryEstimates[catName]
    })

    return newColumns
  }, [kinks, columnCount])

  // Helper function to get column class based on number of columns
  const getColClass = (cols: number): string => {
    const colClasses: Record<number, string> = {
      1: 'grid-col-12',
      2: 'grid-col-6',
      3: 'grid-col-4',
      4: 'grid-col-3',
    }

    return colClasses[cols] || 'grid-col-12'
  }

  return (
    <div id="InputList" className="grid-container">
      <div className="grid-row">
        {columns.map((columnCategories, index) => (
          <div
            key={index}
            className={getColClass(columnCount)}
            role="region"
            aria-label={t('layout.columnLabel', {
              index: index + 1,
              total: columnCount,
            })}
          >
            {columnCategories.map((catName) => {
              const cat = kinks[catName]
              if (
                !cat ||
                !Array.isArray(cat.fields) ||
                !Array.isArray(cat.kinks)
              )
                return null
              return (
                <KinkCategory
                  key={catName}
                  name={catName}
                  fields={cat.fields}
                  kinks={cat.kinks}
                  descriptions={cat.descriptions}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default InputList
