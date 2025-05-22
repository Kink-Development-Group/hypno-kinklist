import React, { useRef, useEffect } from "react";

interface NameModalProps {
  open: boolean;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

const NameModal: React.FC<NameModalProps> = ({ open, onSubmit, onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRef.current) {
      onSubmit(inputRef.current.value);
    }
  };

  if (!open) return null;

  return (
    <div className="overlay visible" role="dialog" aria-modal="true">
      <div className="modal-content name-modal">
        <h2>Name eingeben</h2>
        <form onSubmit={handleSubmit} autoComplete="off">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ihr Name (optional)"
            maxLength={40}
            aria-label="Ihr Name"
            className="modal-input"
            autoFocus
          />
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary">
              Weiter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NameModal;
