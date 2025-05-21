import React, { useState } from 'react';
import { useKinklist } from '../context/KinklistContext';
import { parseKinksText, kinksToText, getAllKinks } from '../utils';

const EditOverlay: React.FC = () => {
  const { 
    kinks, 
    setKinks, 
    levels,
    selection,
    setSelection,
    originalKinksText, 
    setOriginalKinksText, 
    isEditOverlayOpen, 
    setIsEditOverlayOpen 
  } = useKinklist();
  
  const [kinksText, setKinksText] = useState<string>(originalKinksText);

  const handleClose = () => {
    setIsEditOverlayOpen(false);
  };
  const handleAccept = () => {
    try {
      const parsedKinks = parseKinksText(kinksText);
      if (parsedKinks) {
        // Create a new selection based on the updated kink structure
        const newSelection = getAllKinks(parsedKinks, levels, selection);
        
        setKinks(parsedKinks);
        setOriginalKinksText(kinksText);
        setSelection(newSelection);
      }
    } catch (e) {
      alert('Ein Fehler ist beim Versuch, den eingegebenen Text zu analysieren, aufgetreten. Bitte korrigieren Sie ihn und versuchen Sie es erneut.');
      return;
    }
    
    setIsEditOverlayOpen(false);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Ensure the textarea has the current kinksText when opened
  React.useEffect(() => {
    if (isEditOverlayOpen) {
      setKinksText(kinksToText(kinks));
    }
  }, [isEditOverlayOpen, kinks]);

  return (
    <div 
      id="EditOverlay" 
      className="overlay" 
      style={{ display: isEditOverlayOpen ? 'block' : 'none' }}
      onClick={handleOverlayClick}
    >
      <textarea 
        id="Kinks"
        value={kinksText}
        onChange={(e) => setKinksText(e.target.value)}
      />
      <button id="KinksOK" onClick={handleAccept}>Akzeptieren</button>
    </div>
  );
};

export default EditOverlay;
