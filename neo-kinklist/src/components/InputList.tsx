import React, { useEffect, useState } from 'react';
import KinkCategory from './KinkCategory';
import { useKinklist } from '../context/KinklistContext';

const InputList: React.FC = () => {
  const { kinks } = useKinklist();
  const [columnCount, setColumnCount] = useState<number>(0);
  const [categories, setCategories] = useState<React.ReactNode[]>([]);
  const [columns, setColumns] = useState<React.ReactNode[][]>([]);

  // Create category components
  useEffect(() => {
    if (Object.keys(kinks).length === 0) return;

    const catComponents = Object.entries(kinks).map(([catName, category]) => (
      <KinkCategory 
        key={catName}
        name={catName}
        fields={category.fields}
        kinks={category.kinks}
      />
    ));

    setCategories(catComponents);
  }, [kinks]);

  // Handle window resize and calculate columns
  useEffect(() => {
    const calculateColumns = () => {
      const numCols = Math.floor((document.body.scrollWidth - 20) / 400);
      return Math.min(Math.max(numCols, 1), 4);
    };

    const onResize = () => {
      setColumnCount(calculateColumns());
    };

    // Initial calculation
    onResize();

    // Add event listener
    window.addEventListener('resize', onResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Distribute categories into columns
  useEffect(() => {
    if (columnCount === 0 || categories.length === 0) return;

    // Create empty columns
    const newColumns: React.ReactNode[][] = Array.from({ length: columnCount }, () => []);

    // Function to calculate total height of components
    const calculateTotalHeight = () => {
      const categoryElements = document.querySelectorAll('.kinkCategory');
      let totalHeight = 0;
      
      categoryElements.forEach(element => {
        totalHeight += element.clientHeight;
      });
      
      return totalHeight;
    };

    // Function to get current height of a column
    const getColumnHeight = (colIndex: number) => {
      const column = document.querySelector(`.col.col${getColClass(columnCount)}:nth-child(${colIndex + 1})`);
      return column ? column.clientHeight : 0;
    };

    // Wait for elements to be rendered to calculate heights
    setTimeout(() => {
      const totalHeight = calculateTotalHeight();
      const targetHeight = totalHeight / columnCount;
      
      // Place categories in columns to balance height
      let colIndex = 0;
      
      for (let i = 0; i < categories.length; i++) {
        const tempDiv = document.createElement('div');
        document.body.appendChild(tempDiv);
        
        // Create a temporary container to measure height
        const categoryClass = (categories[i] as any).props.className;
        tempDiv.className = categoryClass;
        const catHeight = tempDiv.offsetHeight;
        document.body.removeChild(tempDiv);
        
        const currentHeight = getColumnHeight(colIndex);
        
        if (currentHeight + (catHeight / 2) > targetHeight && colIndex < columnCount - 1) {
          colIndex++;
        }
        
        newColumns[colIndex].push(categories[i]);
      }
      
      setColumns(newColumns);
    }, 10);
  }, [columnCount, categories]);

  // Helper function to get column class based on number of columns
  const getColClass = (cols: number): string => {
    const colClasses: Record<number, string> = {
      1: '100',
      2: '50',
      3: '33',
      4: '25'
    };
    
    return colClasses[cols] || '100';
  };

  return (
    <div id="InputList">
      {columns.map((column, index) => (
        <div key={index} className={`col col${getColClass(columnCount)}`}>
          {column}
        </div>
      ))}
    </div>
  );
};

export default InputList;
