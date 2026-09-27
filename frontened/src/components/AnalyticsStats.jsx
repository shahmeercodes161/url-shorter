import React from 'react';
import { Link2, MousePointerClick, ShieldCheck, Flame } from 'lucide-react';

export default function AnalyticsStats({ links = [], stats = {} }) {
  const totalLinks = stats.totalLinks ?? links.length;
  const totalClicks = stats.totalClicks ?? links.reduce((sum, l) => sum + (l.totalClicks || 0), 0);
  const activeLinks = stats.activeLinks ?? links.filter(l => l.isActive).length;

  // Find top link with highest clicks
  const topLink = links.length > 0 
    ? [...links].sort((a, b) => (b.totalClicks || 0) - (a.totalClicks || 0))[0] 
    : null;

  const topLinkClicks = topLink ? (topLink.totalClicks || 0) : 0;

  return (
    <div className="analytics-grid">
      {/* 1. Total Links */}
      <div className="kpi-card">
        <div className="kpi-info">
          <p>Total Links</p>
          <h3>{totalLinks}</h3>
          <div className="kpi-subtext">Generated links</div>
        </div>
        <div className="kpi-icon indigo">
          <Link2 size={26} />
        </div>
      </div>

      {/* 2. Total Clicks */}
      <div className="kpi-card">
        <div className="kpi-info">
          <p>Total Clicks</p>
          <h3>{totalClicks}</h3>
          <div className="kpi-subtext">Redirects tracked</div>
        </div>
        <div className="kpi-icon emerald">
          <MousePointerClick size={26} />
        </div>
      </div>

      {/* 3. Active Links */}
      <div className="kpi-card">
        <div className="kpi-info">
          <p>Active Links</p>
          <h3>{activeLinks}</h3>
          <div className="kpi-subtext">{totalLinks - activeLinks} paused</div>
        </div>
        <div className="kpi-icon amber">
          <ShieldCheck size={26} />
        </div>
      </div>

      {/* 4. Top Performing Link */}
      <div className="kpi-card">
        <div className="kpi-info">
          <p>Top Performer</p>
          <h3 style={{ fontSize: topLink ? '22px' : '28px', marginTop: '4px' }}>
            {topLink ? `/${topLink.shortCode}` : '—'}
          </h3>
          <div className="kpi-subtext">
            {topLink ? `${topLinkClicks} clicks recorded` : 'No clicks yet'}
          </div>
        </div>
        <div className="kpi-icon cyan">
          <Flame size={26} />
        </div>
      </div>
    </div>
  );
}
