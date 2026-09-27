import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 size={18} color="#34d399" />,
    error: <AlertCircle size={18} color="#f87171" />,
    info: <Info size={18} color="#818cf8" />
  };

  return (
    <div className="toast-container">
      <div className="toast">
        {icons[toast.type] || icons.info}
        <span>{toast.message}</span>
        <button 
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', marginLeft: '8px' }}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
