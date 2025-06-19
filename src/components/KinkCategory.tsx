import React from 'react'
import { useTranslation } from 'react-i18next'
import { strToClass } from '../utils'
import KinkRow from './KinkRow'

interface KinkCategoryProps {
  name: string
  fields: string[]
  kinks: string[]
  descriptions?: string[]
}

const KinkCategory: React.FC<
  KinkCategoryProps & { descriptions?: string[] }
> = ({ name, fields, kinks, descriptions }) => {
  const { t } = useTranslation()

  return (
    <div
      className={`kinkCategory cat-${strToClass(name)}`}
      data-category={name}
      aria-labelledby={`category-heading-${strToClass(name)}`}
    >
      <h2 id={`category-heading-${strToClass(name)}`}>{name}</h2>
      <table
        className="kinkGroup"
        data-fields={fields.join(',')}
        aria-label={t('kinks.categoryLabel', { categoryName: name })}
      >
        <thead>
          <tr>
            {fields.map((field) => (
              <th key={field} className="choicesCol" scope="col">
                {field}
              </th>
            ))}
            <th scope="col"></th>
          </tr>
        </thead>
        <tbody>
          {kinks.map((kink, idx) => (
            <KinkRow
              key={kink}
              categoryName={name}
              kinkName={kink}
              fields={fields}
              description={
                descriptions && descriptions[idx]
                  ? descriptions[idx]
                  : undefined
              }
              forceInlineTooltip={false}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default KinkCategory
