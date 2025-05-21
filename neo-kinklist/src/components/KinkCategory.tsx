import React from 'react';
import KinkRow from './KinkRow';
import { strToClass } from '../utils';

interface KinkCategoryProps {
  name: string;
  fields: string[];
  kinks: string[];
}

const KinkCategory: React.FC<KinkCategoryProps> = ({ name, fields, kinks }) => {
  return (
    <div className={`kinkCategory cat-${strToClass(name)}`} data-category={name}>
      <h2>{name}</h2>
      <table className="kinkGroup" data-fields={fields.join(',')}>
        <thead>
          <tr>
            {fields.map(field => (
              <th key={field} className="choicesCol">{field}</th>
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {kinks.map(kink => (
            <KinkRow 
              key={kink} 
              categoryName={name} 
              kinkName={kink} 
              fields={fields} 
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default KinkCategory;
