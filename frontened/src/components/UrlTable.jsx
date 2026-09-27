import React, { useState } from 'react';
import { Copy, Trash2, Power, Search, ExternalLink, Download } from 'lucide-react';
import { API_BASE } from '../config/api';

export default function UrlTable({ links, onToggleStatus, onDelete, onExportCSV }) {
  const [search, setSearch] = useState('');

  const filtered = links.filter(l => 
    l.originalUrl.toLowerCase().includes(search.toLowerCase()) ||
    l.shortCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Manage Links</h2>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><Search size={16}/></span>
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search links..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
            />
          </div>
          <button onClick={onExportCSV} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Download size={16} /> CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-200">
              <th className="py-3 px-4">Short Code</th>
              <th className="py-3 px-4">Original URL</th>
              <th className="py-3 px-4">Clicks</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {filtered.map(link => (
              <tr key={link.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 text-indigo-600 font-medium">
                  <a href={`${API_BASE}/${link.shortCode}`} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                    {link.shortCode} <ExternalLink size={12}/>
                  </a>
                </td>
                <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{link.originalUrl}</td>
                <td className="py-3 px-4 font-bold text-gray-900">{link.totalClicks}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${link.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {link.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button onClick={() => navigator.clipboard.writeText(`${API_BASE}/${link.shortCode}`)} className="p-1 text-gray-500 hover:text-indigo-600"><Copy size={16}/></button>
                  <button onClick={() => onToggleStatus(link.id)} className="p-1 text-amber-500"><Power size={16}/></button>
                  <button onClick={() => onDelete(link.id)} className="p-1 text-red-500"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}