import React, { useState } from 'react';
import { 
  Search, Download, Copy, Check, QrCode, 
  ExternalLink, Trash2, Power, Globe, 
  Clock, X, Link2, MousePointerClick 
} from 'lucide-react';
import { API_BASE } from '../config/api';

// Format relative date friendly
function formatRelativeDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

export default function LinksTable({ 
  links = [], 
  onToggleStatus, 
  onRequestDelete, 
  onOpenQr, 
  onCopy 
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, paused
  const [sortBy, setSortBy] = useState('newest'); // newest, clicks, oldest
  const [copiedCode, setCopiedCode] = useState(null);

  const getFullShortUrl = (shortCode) => {
    return `${API_BASE}/${shortCode}`;
  };

  const handleCopyLink = (shortCode) => {
    const fullUrl = getFullShortUrl(shortCode);
    navigator.clipboard.writeText(fullUrl);
    setCopiedCode(shortCode);
    if (onCopy) onCopy(fullUrl);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const handleExportCSV = () => {
    if (!links || links.length === 0) return;
    
    const headers = ['Short Code', 'Original URL', 'Short URL', 'Clicks', 'Status', 'Created At'];
    const rows = links.map(l => [
      `"${l.shortCode}"`,
      `"${(l.originalUrl || '').replace(/"/g, '""')}"`,
      `"${getFullShortUrl(l.shortCode)}"`,
      l.totalClicks || 0,
      l.isActive ? 'Active' : 'Paused',
      `"${new Date(l.createdAt).toLocaleString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `snaplink-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter links
  const filteredLinks = links.filter(l => {
    const matchesSearch = 
      (l.originalUrl || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.shortCode || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? l.isActive :
      !l.isActive;

    return matchesSearch && matchesStatus;
  });

  // Sort links
  const sortedLinks = [...filteredLinks].sort((a, b) => {
    if (sortBy === 'clicks') return (b.totalClicks || 0) - (a.totalClicks || 0);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    return new Date(b.createdAt) - new Date(a.createdAt); // newest
  });

  return (
    <div className="links-section">
      {/* Table Toolbar */}
      <div className="section-toolbar">
        <div className="section-title">
          <h2>Manage Links</h2>
          <span className="count-chip">{filteredLinks.length}</span>
        </div>

        <div className="toolbar-controls">
          {/* Search Box */}
          <div className="search-container">
            <span className="search-icon">
              <Search size={15} />
            </span>
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code or URL..."
              className="search-input"
            />
            {search && (
              <button onClick={() => setSearch('')} className="clear-search-btn" title="Clear">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="paused">Paused Only</option>
          </select>

          {/* Sort By */}
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)} 
            className="filter-select"
          >
            <option value="newest">Newest First</option>
            <option value="clicks">Most Clicks</option>
            <option value="oldest">Oldest First</option>
          </select>

          {/* CSV Export */}
          <button 
            onClick={handleExportCSV} 
            className="btn-csv" 
            disabled={links.length === 0}
            title="Download CSV report"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Links Content */}
      {sortedLinks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Link2 size={28} />
          </div>
          <h3>{search ? 'No matching links found' : 'No shortened links yet'}</h3>
          <p>
            {search 
              ? 'Try modifying your search keywords or clearing filters.' 
              : 'Paste your long link in the box above to generate your first trackable short link!'}
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="links-table">
            <thead>
              <tr>
                <th>Short Link</th>
                <th>Destination</th>
                <th>Clicks</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedLinks.map(link => {
                const shortUrl = getFullShortUrl(link.shortCode);
                const isCopied = copiedCode === link.shortCode;

                return (
                  <tr key={link._id || link.id}>
                    {/* Short Link */}
                    <td>
                      <div className="short-cell">
                        <a 
                          href={shortUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="short-link-anchor"
                          title="Open short link"
                        >
                          /{link.shortCode}
                          <ExternalLink size={12} />
                        </a>
                        <button 
                          onClick={() => handleCopyLink(link.shortCode)} 
                          className="btn-copy-mini" 
                          title="Copy short link"
                        >
                          {isCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>

                    {/* Destination */}
                    <td className="dest-cell">
                      <a 
                        href={link.originalUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="dest-link"
                        title={link.originalUrl}
                      >
                        <Globe size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                        {link.originalUrl}
                      </a>
                    </td>

                    {/* Clicks */}
                    <td>
                      <div className="clicks-badge">
                        <MousePointerClick size={14} style={{ color: 'var(--text-accent)' }} />
                        <span>{link.totalClicks || 0}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`status-pill ${link.isActive ? 'active' : 'paused'}`}>
                        <span style={{ 
                          width: '6px', 
                          height: '6px', 
                          borderRadius: '50%', 
                          background: link.isActive ? '#10b981' : '#f59e0b' 
                        }}></span>
                        {link.isActive ? 'Active' : 'Paused'}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} />
                        {formatRelativeDate(link.createdAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="actions-cell">
                        {/* Copy URL */}
                        <button 
                          onClick={() => handleCopyLink(link.shortCode)} 
                          className="btn-table-action" 
                          title="Copy Short Link"
                        >
                          {isCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        </button>

                        {/* QR Code */}
                        <button 
                          onClick={() => onOpenQr({ ...link, shortUrl })} 
                          className="btn-table-action" 
                          title="QR Code & Download"
                        >
                          <QrCode size={14} />
                        </button>

                        {/* Test Open */}
                        <a 
                          href={shortUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="btn-table-action" 
                          title="Test Redirect"
                        >
                          <ExternalLink size={14} />
                        </a>

                        {/* Toggle Active/Pause */}
                        <button 
                          onClick={() => onToggleStatus(link._id || link.id)} 
                          className="btn-table-action toggle" 
                          title={link.isActive ? 'Pause Link' : 'Activate Link'}
                        >
                          <Power size={14} />
                        </button>

                        {/* Delete Link */}
                        <button 
                          onClick={() => onRequestDelete(link)} 
                          className="btn-table-action delete" 
                          title="Delete Link"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
