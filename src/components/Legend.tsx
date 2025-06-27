import React from 'react'
import { useTranslation } from 'react-i18next'
import { useKinklist } from '../context/KinklistContext'

const Legend: React.FC = () => {
  const { levels } = useKinklist()
  const { t } = useTranslation()

  return (
    <div className="legend-container">
      <div className="legend">
        <h2 className="legend-title">{t('legend.title')}</h2>
        {Object.entries(levels).map(([levelKey, level]) => (
          <div className="legend-item" key={levelKey}>
            <span
              data-color={level.color}
              className={`choice ${level.class}`}
            />
            <span className="legend-text">{t(`legend.${level.key}`)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Legend
