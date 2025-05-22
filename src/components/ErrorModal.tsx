import React from "react";

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ message, onClose }) => {
  return (
    <div className="overlay visible" role="alertdialog" aria-modal="true">
      <div className="modal-content error-modal">
        <h2>Fehler</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose} autoFocus>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
