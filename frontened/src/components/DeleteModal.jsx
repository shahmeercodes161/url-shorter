import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteModal({ link, onConfirm, onCancel }) {
  if (!link) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onCancel} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="danger-modal-icon">
          <AlertTriangle size={28} />
        </div>

        <h3 className="modal-title">Delete Short Link?</h3>
        <p className="modal-subtitle" style={{ marginTop: '8px' }}>
          Are you sure you want to delete short link <strong>/{link.shortCode}</strong>? Anyone clicking this link in the future will receive a 404 error.
        </p>

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button 
            onClick={onCancel}
            className="btn-action-secondary" 
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(link._id || link.id)}
            className="btn-danger"
            style={{ flex: 1 }}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}
