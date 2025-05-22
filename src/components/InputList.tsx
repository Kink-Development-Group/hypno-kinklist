import React, { useEffect, useState, useMemo, memo } from "react";
import KinkCategory from "./KinkCategory";
import { useKinklist } from "../context/KinklistContext";

const InputList: React.FC = () => {
  const { kinks } = useKinklist();
  const [columnCount, setColumnCount] = useState<number>(1);
  const [columns, setColumns] = useState<string[][]>([]);

  // Calculate column count based on screen width
  useEffect(() => {
    const calculateColumns = () => {
      const numCols = Math.floor((window.innerWidth - 20) / 400);
      return Math.min(Math.max(numCols, 1), 4); // Zwischen 1 und 4 Spalten
    };

    const handleResize = () => {
      setColumnCount(calculateColumns());
    };

    // Initial calculation
    handleResize();

    // Add resize event listener
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Distributor for categories into columns - more React way
  // This avoids direct DOM manipulation
  useMemo(() => {
    if (Object.keys(kinks).length === 0 || columnCount <= 0) return;

    // Estimate heights of categories based on number of rows
    const categoryEstimates: Record<string, number> = {};
    Object.entries(kinks).forEach(([catName, category]) => {
      // Estimated height = table header + kinks * row height + some margin
      categoryEstimates[catName] = 40 + category.kinks.length * 30 + 20;
    }); // Distribute categories into columns
    const newColumns: string[][] = Array(columnCount)
      .fill(null)
      .map(() => []);
    const columnHeights: number[] = Array(columnCount).fill(0);

    Object.keys(kinks).forEach((catName) => {
      // Find column with minimum height
      const minHeightColIndex = columnHeights.indexOf(
        Math.min(...columnHeights),
      );

      // Add category to that column
      newColumns[minHeightColIndex].push(catName);

      // Update column height
      columnHeights[minHeightColIndex] += categoryEstimates[catName];
    });

    setColumns(newColumns);
  }, [kinks, columnCount]);
  // Helper function to get column class based on number of columns
  const getColClass = (cols: number): string => {
    const colClasses: Record<number, string> = {
      1: "grid-col-12",
      2: "grid-col-6",
      3: "grid-col-4",
      4: "grid-col-3",
    };

    return colClasses[cols] || "grid-col-12";
  };

  return (
    <div id="InputList" className="grid-container">
      <div className="grid-row">
        {columns.map((columnCategories, index) => (
          <div
            key={index}
            className={getColClass(columnCount)}
            role="region"
            aria-label={`Spalte ${index + 1} von ${columnCount}`}
          >
            {columnCategories.map((catName) => (
              <KinkCategory
                key={catName}
                name={catName}
                fields={kinks[catName].fields}
                kinks={kinks[catName].kinks}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(InputList);
