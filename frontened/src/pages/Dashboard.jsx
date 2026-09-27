import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import AnalyticsStats from '../components/AnalyticsStats';
import UrlShortenerCard from '../components/UrlShortenerCard';
import LinksTable from '../components/LinksTable';
import QrModal from '../components/QrModal';
import DeleteModal from '../components/DeleteModal';
import Toast from '../components/Toast';
import { API_BASE } from '../config/api';

export default function Dashboard() {
  const [links, setLinks] = useState([]);
  const [stats, setStats] = useState({ totalLinks: 0, totalClicks: 0, activeLinks: 0 });
  const [storageInfo, setStorageInfo] = useState({ connected: false, type: 'Loading...' });
  const [serverStatus, setServerStatus] = useState('loading');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [newLink, setNewLink] = useState(null);
  const [selectedQrLink, setSelectedQrLink] = useState(null);
  const [deletingLink, setDeletingLink] = useState(null);
  const [toast, setToast] = useState(null);

  // Theme support
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('snaplink_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('snaplink_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev && prev.message === message ? null : prev));
    }, 3200);
  }, []);

  // Fetch all analytics and links from backend
  const fetchLinks = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/analytics`);
      if (!res.ok) throw new Error('Server returned an error');
      const data = await res.json();
      
      // Handles both array and object response
      const linkList = Array.isArray(data) ? data : (data.links || []);
      setLinks(linkList);

      if (data.stats) {
        setStats(data.stats);
      } else {
        const totalClicks = linkList.reduce((acc, curr) => acc + (curr.totalClicks || 0), 0);
        const activeLinks = linkList.filter(l => l.isActive).length;
        setStats({ totalLinks: linkList.length, totalClicks, activeLinks });
      }

      if (data.storage) {
        setStorageInfo(data.storage);
      }

      setServerStatus('online');
    } catch (err) {
      console.warn('Backend fetch failed:', err.message);
      setServerStatus('offline');
      if (!isSilent) {
        showToast('Could not reach backend server at ' + API_BASE, 'error');
      }
    } finally {
      if (!isSilent) setIsRefreshing(false);
    }
  }, [showToast]);

  // Initial load
  useEffect(() => {
    fetchLinks();
    // Poll updates every 15s to keep live clicks updated
    const interval = setInterval(() => {
      fetchLinks(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchLinks]);

  // Handle URL Shortening
  const handleShorten = async ({ longUrl, customCode }) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ longUrl, customCode })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to shorten URL', 'error');
        return;
      }

      const createdUrl = data.data;
      const fullShortUrl = data.shortUrl || `${API_BASE}/${createdUrl.shortCode}`;

      const spotlightData = {
        ...createdUrl,
        shortUrl: fullShortUrl
      };

      setNewLink(spotlightData);
      showToast('Short URL generated successfully! ✨', 'success');

      // Refresh list
      fetchLinks(true);
    } catch (err) {
      console.error('Error during shortening:', err);
      showToast('Connection error. Is backend server running on port 5000?', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Toggle Active/Paused Status
  const handleToggleStatus = async (id) => {
    // Optimistic UI update
    setLinks(prev => prev.map(l => {
      if ((l._id || l.id) === id) {
        return { ...l, isActive: !l.isActive };
      }
      return l;
    }));

    try {
      const res = await fetch(`${API_BASE}/links/${id}/toggle`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to toggle status');
      }
      showToast(`Link status changed to ${data.data.isActive ? 'Active' : 'Paused'}`, 'info');
      fetchLinks(true);
    } catch (err) {
      console.error('Toggle error:', err);
      showToast('Failed to update status on server', 'error');
      fetchLinks(true); // Rollback
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async (id) => {
    const linkToDelete = deletingLink;
    setDeletingLink(null);

    // Optimistic UI update
    setLinks(prev => prev.filter(l => (l._id || l.id) !== id));

    try {
      const res = await fetch(`${API_BASE}/links/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete');
      }
      showToast(`Deleted /${linkToDelete?.shortCode || 'link'}`, 'info');
      fetchLinks(true);
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete link on server', 'error');
      fetchLinks(true); // Rollback
    }
  };

  return (
    <>
      {/* Dynamic Ambient Background Glows */}
      <div className="ambient-glow" aria-hidden="true"></div>
      <div className="ambient-glow-bottom" aria-hidden="true"></div>

      <div className="app-layout">
        {/* Navigation Bar */}
        <Navbar 
          theme={theme}
          onToggleTheme={toggleTheme}
          serverStatus={serverStatus}
          storageInfo={storageInfo}
          onRefresh={() => fetchLinks(false)}
          isRefreshing={isRefreshing}
        />

        {/* Hero Section */}
        <header className="hero">
          <div className="hero-pill">
            <span>✨ Lightning-fast URL Shortener</span>
          </div>
          <h2>
            Shorter Links, <span className="hero-gradient-text">Infinite Reach</span>
          </h2>
          <p>
            Create memorable custom links, generate instant QR codes, and monitor click analytics in real-time.
          </p>
        </header>

        {/* Smart Shortener Form & Spotlight Card */}
        <main>
          <UrlShortenerCard 
            onShorten={handleShorten}
            isLoading={isLoading}
            newLink={newLink}
            onOpenQr={(link) => setSelectedQrLink(link)}
          />

          {/* Real-time KPI Stats Grid */}
          <AnalyticsStats links={links} stats={stats} />

          {/* Links Management Table */}
          <LinksTable 
            links={links}
            onToggleStatus={handleToggleStatus}
            onRequestDelete={(link) => setDeletingLink(link)}
            onOpenQr={(link) => setSelectedQrLink(link)}
            onCopy={(url) => showToast('Copied short link to clipboard! 📋', 'success')}
          />
        </main>

        {/* Modals & Overlays */}
        {selectedQrLink && (
          <QrModal 
            link={selectedQrLink}
            onClose={() => setSelectedQrLink(null)}
            onCopy={() => showToast('Copied link to clipboard! 📋', 'success')}
          />
        )}

        {deletingLink && (
          <DeleteModal 
            link={deletingLink}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeletingLink(null)}
          />
        )}

        {/* Toast System */}
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Footer */}
        <footer className="footer">
          <p>
            <strong>SnapLink URL Shortener</strong> &bull; Crafted with precision &bull; {storageInfo?.type || 'Backend Ready'}
          </p>
        </footer>
      </div>
    </>
  );
}