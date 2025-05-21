import React, { useEffect, useState } from 'react';
import { useKinklist } from '../context/KinklistContext';

interface ChoiceProps {
  field: string;
  categoryName: string;
  kinkName: string;
}

const Choice: React.FC<ChoiceProps> = ({ field, categoryName, kinkName }) => {
  const { levels, selection, setSelection } = useKinklist();
  const [selectedLevel, setSelectedLevel] = useState<string>(Object.keys(levels)[0]);
  
  // Find the current selection for this choice
  useEffect(() => {
    const currentSelection = selection.find(item => 
      item.category === categoryName && 
      item.kink === kinkName && 
      item.field === field
    );
    
    if (currentSelection) {
      setSelectedLevel(currentSelection.value);
    }
  }, [selection, categoryName, kinkName, field]);

  const handleClick = (levelName: string) => {
    setSelectedLevel(levelName);
    
    // Update the global selection state
    const updatedSelection = selection.map(item => {
      if (item.category === categoryName && item.kink === kinkName && item.field === field) {
        return { ...item, value: levelName };
      }
      return item;
    });
    
    setSelection(updatedSelection);
  };

  return (
    <div 
      className={`choices choice-${field.toLowerCase().replace(/\s+/g, '')}`}
      data-field={field}
    >
      {Object.entries(levels).map(([levelName, level], index) => (
        <button
          key={levelName}
          className={`choice ${level.class} ${selectedLevel === levelName ? 'selected' : ''}`}
          data-level={levelName}
          data-level-int={index}
          title={levelName}
          style={{ backgroundColor: level.color }}
          onClick={() => handleClick(levelName)}
        />
      ))}
    </div>
  );
};

export default Choice;

export default Choice;
