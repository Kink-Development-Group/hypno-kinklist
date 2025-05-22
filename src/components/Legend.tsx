import React from "react";
import { useKinklist } from "../context/KinklistContext";

const Legend: React.FC = () => {
  const { levels } = useKinklist();

  return (
    <div className="legend-container">
      <div className="legend">
        {Object.entries(levels).map(([levelName, level]) => (
          <div className="legend-item" key={levelName}>
            <span
              data-color={level.color}
              className={`choice ${level.class}`}
            />
            <span className="legend-text">{levelName}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Legend;
