import React, { memo, useRef } from "react";
import Choice from "./Choice";
import { strToClass } from "../utils";

interface KinkRowProps {
  categoryName: string;
  kinkName: string;
  fields: string[];
  description?: string;
}

const KinkRow: React.FC<KinkRowProps> = ({
  categoryName,
  kinkName,
  fields,
  description,
}) => {
  const rowId = `kink-row-${strToClass(categoryName)}-${strToClass(kinkName)}`;
  const kinkNameId = `kink-name-${strToClass(kinkName)}`;
  const tooltipRef = useRef<HTMLSpanElement>(null);

  // Accessibility: Tooltip per ESC schließen
  const handleTooltipKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Escape") {
      (e.target as HTMLElement).blur();
    }
  };

  return (
    <tr
      className={`kinkRow kink-${strToClass(kinkName)}`}
      data-kink={kinkName}
      id={rowId}
      role="row"
      aria-labelledby={kinkNameId}
    >
      {fields.map((field, index) => (
        <td key={field} role="cell" aria-label={`${field} für ${kinkName}`}>
          <Choice
            field={field}
            categoryName={categoryName}
            kinkName={kinkName}
          />
        </td>
      ))}
      <td id={kinkNameId} className="kink-name" role="cell">
        {kinkName}
        {description && (
          <span className="kink-tooltip">
            <span
              className="kink-tooltip-icon"
              tabIndex={0}
              aria-label="Beschreibung anzeigen"
              onKeyDown={handleTooltipKeyDown}
              ref={tooltipRef}
            >
              ?
            </span>
            <span className="kink-tooltip-text" tabIndex={-1}>
              {description}
            </span>
          </span>
        )}
      </td>
    </tr>
  );
};

export default memo(KinkRow);
