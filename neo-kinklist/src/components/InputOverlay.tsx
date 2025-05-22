import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import { useKinklist } from "../context/KinklistContext";
import { Selection } from "../types";

const InputOverlay: React.FC = () => {
  const {
    selection,
    setSelection,
    levels,
    isInputOverlayOpen,
    setIsInputOverlayOpen,
    popupIndex,
    setPopupIndex,
  } = useKinklist();

  const [previousKinks, setPreviousKinks] = useState<React.ReactNode[]>([]);
  const [nextKinks, setNextKinks] = useState<React.ReactNode[]>([]);
  const [currentKink, setCurrentKink] = useState<Selection | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Number of kinks to show in previous/next sections
  const numPrev = 3;
  const numNext = 3;

  // Close the overlay
  const handleClose = useCallback(() => {
    setIsInputOverlayOpen(false);
  }, [setIsInputOverlayOpen]);

  // Focus management - focus the overlay when it opens
  useEffect(() => {
    if (isInputOverlayOpen && overlayRef.current) {
      overlayRef.current.focus();
    }
  }, [isInputOverlayOpen]);

  // Handle showing previous kink
  const handleShowPrev = useCallback((skip = 1) => {
    let newIndex = (popupIndex - skip + selection.length) % selection.length;
    setPopupIndex(newIndex);
  }, [popupIndex, selection.length, setPopupIndex]);

  // Handle showing next kink
  const handleShowNext = useCallback((skip = 1) => {
    let newIndex = (popupIndex + skip) % selection.length;
    setPopupIndex(newIndex);
  }, [popupIndex, selection.length, setPopupIndex]);

  // Handle level change for current kink
  const handleLevelChange = useCallback((levelName: string) => {
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
      setPopupIndex((current) => (current + 1) % selection.length);
    }
  }, [currentKink, selection, setSelection, setPopupIndex]);

  // Create a kink element for the primary view
  const generatePrimary = useCallback((kink: Selection) => {
    if (!kink) return null;
    
    return (
      <div 
        key={`${kink.category}-${kink.kink}-${kink.field}`}
        role="radiogroup"
        aria-label={`Auswahloptionen für ${kink.kink}`}
      >
        {Object.entries(levels).map(([levelName, level], index) => {
          const isSelected = kink.value === levelName;
          
          return (
            <div 
              key={levelName}
              className={`big-choice ${isSelected ? "selected" : ""}`}
              onClick={() => handleLevelChange(levelName)}
              role="radio"
              aria-checked={isSelected ? "true" : "false"}
              tabIndex={isSelected ? 0 : -1}
            >
              <span 
                className={`choice ${level.class}`} 
                aria-hidden="true"
              />
              {levelName}
              <span className="btn-num-text" aria-hidden="true">{index}</span>
            </div>
          );
        })}
      </div>
    );
  }, [levels, handleLevelChange]);

  // Create a kink element for the secondary (previous/next) view
  const generateSecondary = useCallback((kink: Selection, index: number, onClick: () => void) => {
    if (!kink) return null;
    
    return (
      <div 
        key={`${kink.category}-${kink.kink}-${kink.field}-${index}`}
        className="kink-simple"
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`Zu Kink ${kink.kink} gehen`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <span 
          className={`choice ${levels[kink.value]?.class}`} 
          aria-hidden="true"
        />
        <span className="txt-category">{kink.category}</span>
        {kink.showField && <span className="txt-field">{kink.field}</span>}
        <span className="txt-kink">{kink.kink}</span>
      </div>
    );
  }, [levels]);

  // Close when clicking on the overlay background
  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isInputOverlayOpen) return;
      if (e.altKey || e.shiftKey || e.ctrlKey) return;

      // Up arrow - previous
      if (e.key === "ArrowUp") {
        handleShowPrev();
        e.preventDefault();
      }

      // Down arrow - next
      if (e.key === "ArrowDown") {
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

      // Escape key to close the overlay
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isInputOverlayOpen, levels, handleShowPrev, handleShowNext, handleLevelChange, handleClose]);

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
  }, [popupIndex, selection, numPrev, numNext, generateSecondary, handleShowPrev, handleShowNext]);

  if (!currentKink) return null;

  return (
    <div 
      id="InputOverlay" 
      className={`overlay ${isInputOverlayOpen ? "visible" : ""}`}
      onClick={handleOverlayClick}
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Kink-Auswahl"
      tabIndex={-1}
    >
      <div className="widthWrapper" role="region">
        <div id="InputPrevious" aria-label="Vorherige Kinks">
          {previousKinks}
        </div>
        <div id="InputCurrent" aria-live="polite">
          <h2 id="InputCategory">{currentKink.category}</h2>
          <h3 id="InputField">
            {currentKink.showField ? `(${currentKink.field}) ` : ""}
            {currentKink.kink}
          </h3>
          <button 
            className="closePopup" 
            onClick={handleClose}
            aria-label="Schließen"
          >
            &times;
          </button>
          <div id="InputValues">
            {generatePrimary(currentKink)}
          </div>
        </div>
        <div id="InputNext" aria-label="Nächste Kinks">
          {nextKinks}
        </div>
      </div>
    </div>
  );
};

export default memo(InputOverlay);
