import React, { memo } from 'react';
import Choice from './Choice';
import { strToClass } from '../utils';

interface KinkRowProps {
  categoryName: string;
  kinkName: string;
  fields: string[];
}

const KinkRow: React.FC<KinkRowProps> = ({ categoryName, kinkName, fields }) => {
  const rowId = `kink-row-${strToClass(categoryName)}-${strToClass(kinkName)}`;
  const kinkNameId = `kink-name-${strToClass(kinkName)}`;
  
  return (
    <tr 
      className={`kinkRow kink-${strToClass(kinkName)}`} 
      data-kink={kinkName}
      id={rowId}
      role="row"
      aria-labelledby={kinkNameId}
    >
      {fields.map((field, index) => (
        <td 
          key={field}
          role="cell"
          aria-label={`${field} für ${kinkName}`}
        >
          <Choice 
            field={field} 
            categoryName={categoryName} 
            kinkName={kinkName} 
          />
        </td>
      ))}
      <td 
        id={kinkNameId}
        className="kink-name"
        role="cell"
      >
        {kinkName}
      </td>
    </tr>
  );
};

export default memo(KinkRow);
