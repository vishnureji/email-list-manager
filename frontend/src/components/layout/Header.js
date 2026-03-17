import React from 'react';
import { useLocation } from 'react-router-dom';

const titles = {
  '/': 'Dashboard',
  '/audiences': 'Audiences',
  '/campaigns': 'Campaigns',
  '/reports/weekly': 'Weekly Report',
  '/reports/compare': 'Campaign Comparison',
  '/admin': 'Admin Panel',
};

export default function Header() {
  const location = useLocation();
  const title = Object.entries(titles).find(([path]) => location.pathname === path)?.[1] || 'MailFlow';

  return (
    <header style={{
      height: 'var(--header-height)',
      background: 'rgba(17,17,36,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 4, height: 20, background: 'var(--accent)', borderRadius: 2 }} />
        <h2 style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          padding: '4px 12px',
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 20,
          fontSize: '0.72rem',
          color: 'var(--success)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ width: 6, height: 6, background: 'var(--success)', borderRadius: '50%', display: 'inline-block' }} />
          System Online
        </div>
      </div>
    </header>
  );
}
