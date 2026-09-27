// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import UrlForm from '../components/Urlform';
import UrlTable from '../components/Urltable';
import AnalyticsChart from '../components/AnalyticsChart';

export default function Dashboard() {
  const [links, setLinks] = useState([
    { id: 1, originalUrl: 'https://example.com/long-page-one', shortCode: 'Ab12x', totalClicks: 15, isActive: true },
    { id: 2, originalUrl: 'https://example.com/long-page-two', shortCode: 'Cd34y', totalClicks: 8, isActive: true }
  ]);

  const handleUrlCreated = (longUrl) => {
    const newCode = Math.random().toString(36).substring(2, 7);
    const newEntry = {
      id: links.length + 1,
      originalUrl: longUrl,
      shortCode: newCode,
      totalClicks: 0,
      isActive: true
    };
    setLinks([newEntry, ...links]);
  };

  const handleToggleStatus = (id) => {
    setLinks(links.map(l => l.id === id ? { ...l, isActive: !l.isActive } : l));
  };

  const handleDelete = (id) => {
    setLinks(links.filter(l => l.id !== id));
  };

  const handleExportCSV = () => {
    const csv = "ID,OriginalURL,ShortCode,Clicks\n" + links.map(l => `${l.id},${l.originalUrl},${l.shortCode},${l.totalClicks}`).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">URL Shortener & Analytics Dashboard</h1>
        <AnalyticsChart links={links} />
        <UrlForm onUrlCreated={handleUrlCreated} />
        <UrlTable links={links} onToggleStatus={handleToggleStatus} onDelete={handleDelete} onExportCSV={handleExportCSV} />
      </div>
    </div>
  );
}