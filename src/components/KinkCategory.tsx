import React, { memo } from "react";
import KinkRow from "./KinkRow";
import { strToClass } from "../utils";

interface KinkCategoryProps {
  name: string;
  fields: string[];
  kinks: string[];
}

const KinkCategory: React.FC<KinkCategoryProps> = ({ name, fields, kinks }) => {
  return (
    <div
      className={`kinkCategory cat-${strToClass(name)}`}
      data-category={name}
      aria-labelledby={`category-heading-${strToClass(name)}`}
    >
      <h2 id={`category-heading-${strToClass(name)}`}>{name}</h2>
      <table
        className="kinkGroup"
        data-fields={fields.join(",")}
        aria-label={`Kinks in der Kategorie ${name}`}
      >
        <thead>
          <tr>
            {fields.map((field) => (
              <th key={field} className="choicesCol" scope="col">
                {field}
              </th>
            ))}
            <th scope="col">Kink</th>
          </tr>
        </thead>
        <tbody>
          {kinks.map((kink) => (
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

export default memo(KinkCategory);
