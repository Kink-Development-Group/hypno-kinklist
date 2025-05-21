import React from 'react';
import Choice from './Choice';
import { strToClass } from '../utils';

interface KinkRowProps {
  categoryName: string;
  kinkName: string;
  fields: string[];
}

const KinkRow: React.FC<KinkRowProps> = ({ categoryName, kinkName, fields }) => {
  return (
    <tr 
      className={`kinkRow kink-${strToClass(kinkName)}`} 
      data-kink={kinkName}
    >
      {fields.map(field => (
        <td key={field}>
          <Choice 
            field={field} 
            categoryName={categoryName} 
            kinkName={kinkName} 
          />
        </td>
      ))}
      <td>{kinkName}</td>
    </tr>
  );
};

export default KinkRow;
