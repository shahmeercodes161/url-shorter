import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, ExternalLink } from 'lucide-react';

export default function QrModal({ link, onClose, onCopy }) {
  const [qrSrc, setQrSrc] = useState('');
  const [copied, setCopied] = useState(false);

  const fullUrl = link.shortUrl || `${window.location.protocol}//${window.location.hostname}:5000/${link.shortCode}`;

  useEffect(() => {
    if (!link) return;
    QRCode.toDataURL(fullUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => setQrSrc(url))
      .catch(err => console.error('Error generating QR code:', err));
  }, [link, fullUrl]);

  const handleDownload = () => {
    if (!qrSrc) return;
    const a = document.createElement('a');
    a.href = qrSrc;
    a.download = `snaplink-${link.shortCode}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    if (onCopy) onCopy(fullUrl);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <h3 className="modal-title">QR Code</h3>
        <p className="modal-subtitle">Scan to instantly open <strong>/{link.shortCode}</strong></p>

        <div className="qr-preview-wrapper">
          {qrSrc ? (
            <img src={qrSrc} alt={`QR Code for ${link.shortCode}`} className="qr-code-img" />
          ) : (
            <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="spinner" style={{ borderColor: 'rgba(99,102,241,0.2)', borderTopColor: '#6366f1' }}></div>
            </div>
          )}
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Destination: <span style={{ color: 'var(--text-muted)' }}>{link.originalUrl}</span>
        </div>

        <div className="modal-actions">
          <button onClick={handleDownload} className="btn-action-primary" style={{ justifyContent: 'center', width: '100%' }}>
            <Download size={16} /> Download High-Res PNG
          </button>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleCopyLink} 
              className="btn-action-secondary" 
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              {copied ? 'Copied Link!' : 'Copy Short Link'}
            </button>
            
            <a 
              href={fullUrl} 
              target="_blank" 
              rel="noreferrer"
              className="btn-action-secondary" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Test open link"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
