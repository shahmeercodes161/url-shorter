import React, { useState } from 'react';
import { Link2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function UrlForm({ onUrlCreated }) {
  const [longUrl, setLongUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!longUrl.trim()) {
      setError('URL cannot be blank.');
      return;
    }

    try {
      const parsed = new URL(longUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setError('Only http:// or https:// URLs are allowed.');
        return;
      }
    } catch (_) {
      setError('Invalid URL format.');
      return;
    }

    // Pass new link data up or call backend API
    onUrlCreated(longUrl);
    setLongUrl('');
    setSuccess('Short URL generated!');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Shorten a Long URL</h2>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Link2 size={18} />
          </span>
          <input 
            type="text"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            placeholder="Paste your link here..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg text-sm font-medium transition">
          Shorten
        </button>
      </form>
      {error && <p className="mt-3 text-red-600 text-sm flex items-center gap-1"><AlertCircle size={16}/>{error}</p>}
      {success && <p className="mt-3 text-green-600 text-sm flex items-center gap-1"><CheckCircle2 size={16}/>{success}</p>}
    </div>
  );
}