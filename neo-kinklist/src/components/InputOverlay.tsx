import React, { useState, useEffect, JSX } from 'react';
import { useKinklist } from '../context/KinklistContext';

const InputOverlay: React.FC = () => {
  const { 
    selection, 
    levels, 
    isInputOverlayOpen, 
    setIsInputOverlayOpen, 
    popupIndex, 
    setPopupIndex 
  } = useKinklist();
  
  const [previousKinks, setPreviousKinks] = useState<JSX.Element[]>([]);
  const [nextKinks, setNextKinks] = useState<JSX.Element[]>([]);
  const [currentKink, setCurrentKink] = useState<any>(null);

  // Number of kinks to show in previous/next sections
  const numPrev = 3;
  const numNext = 3;

  // Create a kink element for the primary view
  const generatePrimary = (kink: any) => {
    return (
      <div key={`${kink.category}-${kink.kink}-${kink.field}`}>
        {Object.entries(levels).map(([levelName, level], index) => {
          const isSelected = kink.value === levelName;
          
          return (
            <div 
              key={levelName}
              className={`big-choice ${isSelected ? 'selected' : ''}`}
              onClick={() => handleLevelChange(levelName)}
            >
              <span 
                className={`choice ${level.class}`} 
                style={{ backgroundColor: level.color }}
              />
              {levelName}
              <span className="btn-num-text">{index}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Create a kink element for the secondary (previous/next) view
  const generateSecondary = (kink: any, index: number, onClick: () => void) => {
    return (
      <div 
        key={`${kink.category}-${kink.kink}-${kink.field}-${index}`}
        className="kink-simple"
        onClick={onClick}
      >
        <span 
          className={`choice ${levels[kink.value]?.class}`} 
          style={{ backgroundColor: levels[kink.value]?.color }}
        />
        <span className="txt-category">{kink.category}</span>
        {kink.showField && <span className="txt-field">{kink.field}</span>}
        <span className="txt-kink">{kink.kink}</span>
      </div>
    );
  };
  // Handle level change for current kink
  const handleLevelChange = (levelName: string) => {
    // Update the kink value
    if (currentKink) {
      // Update the selection in the context
      const updatedSelection = selection.map(item => {
        if (
          item.category === currentKink.category && 
          item.kink === currentKink.kink && 
          item.field === currentKink.field
        ) {
          return { ...item, value: levelName };
        }
        return item;
      });
      
      // Update current kink
      setCurrentKink({
        ...currentKink,
        value: levelName
      });
      
      // Update global selection
      setSelection(updatedSelection);
      
      // Move to next kink
      handleShowNext();
    }
  };

  // Handle showing previous kink
  const handleShowPrev = (skip = 1) => {
    let newIndex = (popupIndex - skip + selection.length) % selection.length;
    setPopupIndex(newIndex);
  };

  // Handle showing next kink
  const handleShowNext = (skip = 1) => {
    let newIndex = (popupIndex + skip) % selection.length;
    setPopupIndex(newIndex);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isInputOverlayOpen) return;
      if (e.altKey || e.shiftKey || e.ctrlKey) return;

      // Up arrow - previous
      if (e.key === 'ArrowUp') {
        handleShowPrev();
        e.preventDefault();
      }

      // Down arrow - next
      if (e.key === 'ArrowDown') {
        handleShowNext();
        e.preventDefault();
      }

      // Number keys 0-5 for quick selection
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 0 && num <= 5) {
        const levelNames = Object.keys(levels);
        if (num < levelNames.length) {
          handleLevelChange(levelNames[num]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isInputOverlayOpen, currentKink, levels]);

  // Update content when popup index changes
  useEffect(() => {
    if (!selection.length) return;

    // Get current kink
    const current = selection[popupIndex];
    setCurrentKink(current);

    // Get previous kinks
    const prev = [];
    for (let i = numPrev; i > 0; i--) {
      const prevIndex = (popupIndex - i + selection.length) % selection.length;
      const prevKink = selection[prevIndex];
      
      prev.push(
        generateSecondary(
          prevKink, 
          i, 
          () => handleShowPrev(i)
        )
      );
    }
    setPreviousKinks(prev);

    // Get next kinks
    const next = [];
    for (let i = 1; i <= numNext; i++) {
      const nextIndex = (popupIndex + i) % selection.length;
      const nextKink = selection[nextIndex];
      
      next.push(
        generateSecondary(
          nextKink, 
          i, 
          () => handleShowNext(i)
        )
      );
    }
    setNextKinks(next);
  }, [popupIndex, selection]);

  // Close the overlay
  const handleClose = () => {
    setIsInputOverlayOpen(false);
  };

  // Close when clicking on the overlay background
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!currentKink) return null;

  return (
    <div 
      id="InputOverlay" 
      className="overlay" 
      style={{ display: isInputOverlayOpen ? 'block' : 'none' }}
      onClick={handleOverlayClick}
    >
      <div className="widthWrapper">
        <div id="InputPrevious">
          {previousKinks}
        </div>
        <div id="InputCurrent">
          <h2 id="InputCategory">{currentKink.category}</h2>
          <h3 id="InputField">
            {currentKink.showField ? `(${currentKink.field}) ` : ''}
            {currentKink.kink}
          </h3>
          <button className="closePopup" onClick={handleClose}>&times;</button>
          <div id="InputValues">
            {generatePrimary(currentKink)}
          </div>
        </div>
        <div id="InputNext">
          {nextKinks}
        </div>
      </div>
    </div>
  );
};

export default InputOverlay;
