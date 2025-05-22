import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import { useKinklist } from "../context/KinklistContext";
import { parseKinksText, kinksToText, getAllKinks } from "../utils";

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
    setIsEditOverlayOpen,
  } = useKinklist();

  const [kinksText, setKinksText] = useState<string>(originalKinksText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus management
  useEffect(() => {
    if (isEditOverlayOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditOverlayOpen]);

  const handleClose = useCallback(() => {
    setIsEditOverlayOpen(false);
  }, [setIsEditOverlayOpen]);

  const handleAccept = useCallback(() => {
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
      alert(
        "Ein Fehler ist beim Versuch, den eingegebenen Text zu analysieren, aufgetreten. Bitte korrigieren Sie ihn und versuchen Sie es erneut.",
      );
      return;
    }

    setIsEditOverlayOpen(false);
  }, [
    kinksText,
    levels,
    selection,
    setKinks,
    setOriginalKinksText,
    setSelection,
    setIsEditOverlayOpen,
  ]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose],
  );

  // Keyboard event handlers
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Escape key to close overlay
      if (e.key === "Escape") {
        handleClose();
      }

      // Ctrl+Enter to accept changes
      if (e.key === "Enter" && e.ctrlKey) {
        handleAccept();
      }
    },
    [handleClose, handleAccept],
  );

  // Ensure the textarea has the current kinksText when opened
  useEffect(() => {
    if (isEditOverlayOpen) {
      setKinksText(kinksToText(kinks));
    }
  }, [isEditOverlayOpen, kinks]);

  return (
    <div
      id="EditOverlay"
      className={`overlay ${isEditOverlayOpen ? "visible" : ""}`}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-overlay-title"
    >
      <div role="document" className="edit-overlay-content">
        <h2 id="edit-overlay-title" className="sr-only">
          Kink Liste Bearbeiten
        </h2>
        <textarea
          id="Kinks"
          ref={textareaRef}
          value={kinksText}
          onChange={(e) => setKinksText(e.target.value)}
          aria-label="Kinks Liste bearbeiten"
          placeholder="Kategorie und Kinks hier eingeben..."
        />
        <div className="edit-overlay-actions">
          <button
            id="KinksOK"
            onClick={handleAccept}
            type="button"
            aria-label="Änderungen akzeptieren"
          >
            Akzeptieren
          </button>
          <button
            onClick={handleClose}
            type="button"
            aria-label="Bearbeitung abbrechen"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(EditOverlay);
