import React, { memo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import Choice from "./Choice";
import { strToClass } from "../utils";

interface KinkRowProps {
  categoryName: string;
  kinkName: string;
  fields: string[];
  description?: string;
  forceInlineTooltip?: boolean; // Neu: für Modals/Overlays
}

const KinkRow: React.FC<KinkRowProps> = ({
  categoryName,
  kinkName,
  fields,
  description,
  forceInlineTooltip = false,
}) => {
  const rowId = `kink-row-${strToClass(categoryName)}-${strToClass(kinkName)}`;
  const kinkNameId = `kink-name-${strToClass(kinkName)}`;
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  }>();

  // Tooltip-Portal-Logik
  const handleTooltipShow = (e: React.MouseEvent | React.FocusEvent) => {
    if (!tooltipRef.current) return;
    const rect = tooltipRef.current.getBoundingClientRect();
    setTooltipPos({
      top: rect.bottom + 6, // etwas Abstand nach unten
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
    setShowTooltip(true);
  };
  const handleTooltipHide = () => setShowTooltip(false);

  // Accessibility: Tooltip per ESC schließen
  const handleTooltipKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Escape") {
      (e.target as HTMLElement).blur();
      setShowTooltip(false);
    }
  };

  // Tooltip-Element als Portal oder Inline
  const tooltipNode =
    !forceInlineTooltip && showTooltip && tooltipPos && description
      ? ReactDOM.createPortal(
          <div
            className="kink-tooltip-text kink-tooltip-portal"
            style={{
              position: "fixed" as const,
              top: tooltipPos.top,
              left: tooltipPos.left,
              zIndex: 99999 as const,
            }}
            tabIndex={-1}
            onMouseLeave={handleTooltipHide}
          >
            {description}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {tooltipNode}
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
                onMouseEnter={handleTooltipShow}
                onFocus={handleTooltipShow}
                onMouseLeave={handleTooltipHide}
                onBlur={handleTooltipHide}
              >
                ?
              </span>
              {forceInlineTooltip && (
                <span className="kink-tooltip-text" tabIndex={-1}>
                  {description}
                </span>
              )}
            </span>
          )}
        </td>
      </tr>
    </>
  );
};

export default memo(KinkRow);
