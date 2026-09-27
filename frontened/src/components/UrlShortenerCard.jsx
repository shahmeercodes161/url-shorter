import React, { useState } from 'react';
import { 
  Link2, Sparkles, ChevronDown, ChevronUp, Copy, 
  Check, QrCode, ExternalLink, X, ClipboardPaste, AlertCircle 
} from 'lucide-react';

export default function UrlShortenerCard({ onShorten, isLoading, newLink, onOpenQr }) {
  const [longUrl, setLongUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [inputError, setInputError] = useState('');
  const [copiedRecent, setCopiedRecent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setInputError('');

    const trimmed = longUrl.trim();
    if (!trimmed) {
      setInputError('Please paste or type a URL to shorten.');
      return;
    }

    // Basic quick sanity check
    let testUrl = trimmed;
    if (!/^https?:\/\//i.test(testUrl)) {
      testUrl = `https://${testUrl}`;
    }

    try {
      const parsed = new URL(testUrl);
      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        setInputError('Please enter a valid web domain (e.g. google.com or github.com)');
        return;
      }
    } catch {
      setInputError('Invalid URL format. Please check the address and try again.');
      return;
    }

    if (customCode.trim() && !/^[a-zA-Z0-9-_]{3,30}$/.test(customCode.trim())) {
      setInputError('Custom alias must be 3-30 characters with letters, numbers, hyphens, or underscores only.');
      return;
    }

    onShorten({
      longUrl: trimmed,
      customCode: customCode.trim() || undefined
    });
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setLongUrl(text.trim());
        setInputError('');
      }
    } catch {
      // Clipboard permission denied or unavailable
    }
  };

  const handleCopyRecent = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedRecent(true);
    setTimeout(() => setCopiedRecent(false), 2000);
  };

  return (
    <div className="shortener-box">
      <form onSubmit={handleSubmit} className="input-group-wrapper">
        <div className="main-input-row">
          <div className="input-container">
            <span className="input-icon-left">
              <Link2 size={20} />
            </span>
            <input 
              type="text" 
              value={longUrl} 
              onChange={(e) => {
                setLongUrl(e.target.value);
                if (inputError) setInputError('');
              }} 
              placeholder="Paste any long link here (e.g., https://very-long-url.com/docs/api)..." 
              className="url-input"
              autoFocus
              id="long-url-input"
            />
            <div className="input-quick-actions">
              {longUrl ? (
                <button 
                  type="button" 
                  onClick={() => setLongUrl('')} 
                  className="btn-input-mini" 
                  title="Clear text"
                >
                  <X size={14} /> Clear
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={handlePasteClipboard} 
                  className="btn-input-mini" 
                  title="Paste from clipboard"
                >
                  <ClipboardPaste size={14} /> Paste
                </button>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-shorten" 
            disabled={isLoading || !longUrl.trim()}
            id="shorten-submit-btn"
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span>Shortening...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Shorten URL</span>
              </>
            )}
          </button>
        </div>

        {/* Advanced Options Bar (Custom Alias) */}
        <div className="options-toggle-bar">
          <button 
            type="button" 
            onClick={() => setShowAdvanced(!showAdvanced)} 
            className="toggle-link"
          >
            <span>Custom alias & options</span>
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {showAdvanced && (
          <div className="custom-alias-box">
            <span className="alias-prefix">snap.link /</span>
            <input 
              type="text" 
              value={customCode} 
              onChange={(e) => setCustomCode(e.target.value)} 
              placeholder="my-custom-slug (optional)" 
              className="alias-input"
              maxLength={30}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {customCode.length}/30
            </span>
          </div>
        )}

        {inputError && (
          <div className="form-alert error">
            <AlertCircle size={16} />
            <span>{inputError}</span>
          </div>
        )}
      </form>

      {/* Spotlight Card for freshly created link */}
      {newLink && (
        <div className="spotlight-card">
          <div className="spotlight-header">
            <div className="spotlight-badge">
              <Sparkles size={14} />
              <span>Link Ready to Share!</span>
            </div>
            <button 
              onClick={() => handleCopyRecent(newLink.shortUrl)}
              className="btn-action-primary"
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              {copiedRecent ? <Check size={14} /> : <Copy size={14} />}
              {copiedRecent ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="spotlight-body">
            <div className="spotlight-links">
              <a 
                href={newLink.shortUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="spotlight-short"
              >
                {newLink.shortUrl}
                <ExternalLink size={16} />
              </a>
              <div className="spotlight-original" title={newLink.originalUrl}>
                Target: {newLink.originalUrl}
              </div>
            </div>

            <div className="spotlight-actions">
              <button 
                onClick={() => onOpenQr(newLink)} 
                className="btn-action-secondary"
                title="Generate QR Code"
              >
                <QrCode size={16} /> QR Code
              </button>
              <a 
                href={newLink.shortUrl} 
                target="_blank" 
                rel="noreferrer"
                className="btn-action-secondary"
                title="Test redirect"
              >
                <ExternalLink size={16} /> Test Link
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
