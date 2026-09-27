import React from 'react';
import { BarChart2 } from 'lucide-react';

export default function AnalyticsChart({ links }) {
  const totalClicks = links.reduce((acc, curr) => acc + curr.totalClicks, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Total Links</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-1">{links.length}</h3>
        </div>
        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600"><BarChart2 size={24}/></div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Total Clicks Recorded</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-1">{totalClicks}</h3>
        </div>
        <div className="p-3 bg-green-50 rounded-lg text-green-600"><BarChart2 size={24}/></div>
      </div>
    </div>
  );
}