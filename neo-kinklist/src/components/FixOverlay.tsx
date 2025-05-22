import React, { useCallback } from "react";
import { useKinklist } from "../context/KinklistContext";

const FixOverlay: React.FC = () => {
  const { setIsInputOverlayOpen } = useKinklist();

  const handleFixOverlay = useCallback(() => {
    // Setze den Modal-Status zurück
    setIsInputOverlayOpen(false);
    
    // Zeige Erfolgsmeldung
    alert("Der Modal-Status wurde erfolgreich zurückgesetzt. Sie können das Start-Modal jetzt wieder normal verwenden.");
  }, [setIsInputOverlayOpen]);

  return (
    <div className="fix-overlay">
      <h2>Problem mit dem Start-Modal beheben</h2>
      <p>
        Falls das Start-Modal (Kink-Auswahl) nicht richtig schließt oder nicht angezeigt wird, 
        können Sie mit diesem Button den Status zurücksetzen:
      </p>      <button 
        className="btn"
        onClick={handleFixOverlay}
      >
        Modal-Status zurücksetzen
      </button>
    </div>
  );
};

export default FixOverlay;
