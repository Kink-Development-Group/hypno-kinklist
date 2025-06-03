import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import { useKinklist } from "../context/KinklistContext";
import { Selection } from "../types";

const CommentOverlay: React.FC = () => {
  const {
    selection,
    setSelection,
    isCommentOverlayOpen,
    setIsCommentOverlayOpen,
    selectedKink,
    setSelectedKink,
  } = useKinklist();

  const [comment, setComment] = useState<string>("");
  const overlayRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close the overlay
  const handleClose = useCallback(() => {
    setIsCommentOverlayOpen(false);
    setSelectedKink(null);
  }, [setIsCommentOverlayOpen, setSelectedKink]);

  // Save comment
  const handleSave = useCallback(() => {
    if (selectedKink) {
      const updatedSelection = selection.map((item) => {
        if (
          item.category === selectedKink.category &&
          item.kink === selectedKink.kink &&
          item.field === selectedKink.field
        ) {
          return { ...item, comment: comment.trim() || undefined };
        }
        return item;
      });

      setSelection(updatedSelection);
      handleClose();
    }
  }, [selectedKink, selection, setSelection, comment, handleClose]);

  // Initialize comment when selectedKink changes
  useEffect(() => {
    if (selectedKink) {
      setComment(selectedKink.comment || "");
    }
  }, [selectedKink]);

  // Focus management
  useEffect(() => {
    if (isCommentOverlayOpen && textareaRef.current) {
      // Small delay to ensure the overlay is fully rendered
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isCommentOverlayOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isCommentOverlayOpen) return;

      // Escape key to close
      if (e.key === "Escape") {
        handleClose();
        e.preventDefault();
      }

      // Ctrl+Enter to save
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        handleSave();
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCommentOverlayOpen, handleClose, handleSave]);

  // Close when clicking on the overlay background
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose],
  );

  if (!selectedKink) return null;

  return (
    <div
      id="CommentOverlay"
      className={`overlay ${isCommentOverlayOpen ? "visible" : ""}`}
      onClick={handleOverlayClick}
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="comment-overlay-title"
      tabIndex={-1}
    >
      <div className="comment-overlay-content modal-content">
        <button
          className="close-button"
          onClick={handleClose}
          aria-label="Schließen"
          type="button"
        >
          &times;
        </button>

        <h2 id="comment-overlay-title">Kommentar hinzufügen</h2>

        <div className="comment-kink-info">
          <div className="comment-kink-category">
            <strong>Kategorie:</strong> {selectedKink.category}
          </div>
          {selectedKink.showField && (
            <div className="comment-kink-field">
              <strong>Feld:</strong> {selectedKink.field}
            </div>
          )}
          <div className="comment-kink-name">
            <strong>Kink:</strong> {selectedKink.kink}
          </div>
          <div className="comment-kink-value">
            <strong>Bewertung:</strong> {selectedKink.value}
          </div>
        </div>

        <div className="comment-input-section">
          <label htmlFor="comment-textarea" className="comment-label">
            Kommentar (optional):
          </label>
          <textarea
            id="comment-textarea"
            ref={textareaRef}
            className="comment-textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Fügen Sie hier Ihren Kommentar hinzu..."
            rows={6}
            maxLength={1000}
          />
          <div className="comment-char-count">
            {comment.length}/1000 Zeichen
          </div>
        </div>

        <div className="comment-actions">
          <button
            type="button"
            className="comment-button comment-button-cancel"
            onClick={handleClose}
          >
            Abbrechen
          </button>
          <button
            type="button"
            className="comment-button comment-button-save"
            onClick={handleSave}
          >
            Speichern
          </button>
        </div>

        <div className="comment-shortcuts">
          <small>
            <kbd>Esc</kbd> zum Schließen • <kbd>Strg</kbd>+<kbd>Enter</kbd> zum
            Speichern
          </small>
        </div>
      </div>
    </div>
  );
};

export default memo(CommentOverlay);
