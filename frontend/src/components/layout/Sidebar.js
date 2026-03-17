import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '⬡' },
  { path: '/audiences', label: 'Audiences', icon: '◎' },
  { path: '/campaigns', label: 'Campaigns', icon: '◈' },
  { path: '/reports/weekly', label: 'Weekly Report', icon: '◫' },
  { path: '/reports/compare', label: 'Compare', icon: '⊞' },
  { path: '/admin', label: 'Admin', icon: '⬡', admin: true },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0,
      width: 'var(--sidebar-width)',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 34, height: 34,
          background: 'linear-gradient(135deg, var(--accent), var(--purple))',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, color: 'white',
          flexShrink: 0,
        }}>M</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.02em' }}>MailFlow</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Email Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 10px 4px' }}>Main</div>
        {navItems.filter(i => !i.admin).map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.15s',
              color: isActive ? 'white' : 'var(--text-secondary)',
              background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            })}
          >
            <span style={{ fontSize: '1rem', opacity: 0.8 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '16px 10px 4px' }}>System</div>
        {navItems.filter(i => i.admin).map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.15s',
              color: isActive ? 'white' : 'var(--text-secondary)',
              background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            })}
          >
            <span style={{ fontSize: '1rem', opacity: 0.8 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32,
          background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8rem', fontWeight: 700, color: 'white', flexShrink: 0,
        }}>
          {user?.username?.[0]?.toUpperCase() || 'A'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, truncate: true }}>{user?.username}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user?.role}</div>
        </div>
        <button onClick={handleLogout} className="btn-icon btn btn-secondary" style={{ padding: '6px 8px', fontSize: '0.8rem' }} title="Logout">↪</button>
      </div>
    </aside>
  );
}
