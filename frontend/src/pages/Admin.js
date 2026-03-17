import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function Admin() {
  const [tab, setTab] = useState('password');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.getDashboard().then(d => setStats(d)).catch(() => {});
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (pwForm.newPassword !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 4) { setPwError('Password must be at least 4 characters'); return; }
    setPwLoading(true);
    try {
      await api.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwSuccess('Password updated successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (e) {
      setPwError(e.message);
    } finally {
      setPwLoading(false);
    }
  };

  const tabs = [
    { id: 'password', label: 'Change Password' },
    { id: 'overview', label: 'System Overview' },
    { id: 'about', label: 'About' },
  ];

  return (
    <div className="page-content animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">System settings and management</p>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.15s',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'password' && (
        <div style={{ maxWidth: 480 }}>
          <div className="card card-padded">
            <h3 style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>Change Admin Password</h3>
            {pwError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{pwError}</div>}
            {pwSuccess && <div className="alert alert-success" style={{ marginBottom: 16 }}>{pwSuccess}</div>}
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input className="form-control" type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-control" type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input className="form-control" type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                {pwLoading ? <span className="loading-spinner" /> : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'overview' && (
        <div>
          <div className="grid grid-4" style={{ marginBottom: 24 }}>
            {[
              { label: 'Total Campaigns', value: stats?.campaigns?.total || 0, color: 'var(--accent)' },
              { label: 'Sent Campaigns', value: stats?.campaigns?.sent || 0, color: 'var(--success)' },
              { label: 'Total Audiences', value: stats?.audiences?.total || 0, color: 'var(--cyan)' },
              { label: 'Total Emails Sent', value: stats?.stats?.total_sent || 0, color: 'var(--warning)' },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value mono" style={{ color: s.color }}>{(+s.value || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="card card-padded" style={{ maxWidth: 600 }}>
            <h3 style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>System Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'Platform', value: 'MailFlow v1.0.0' },
                { key: 'Database', value: 'PostgreSQL' },
                { key: 'Backend', value: 'Node.js + Express' },
                { key: 'Frontend', value: 'React 18' },
                { key: 'Deployment', value: 'Railway' },
                { key: 'Default Admin', value: 'username: admin' },
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{item.key}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'about' && (
        <div style={{ maxWidth: 600 }}>
          <div className="card card-padded">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 64, height: 64, margin: '0 auto 16px',
                background: 'linear-gradient(135deg, var(--accent), var(--purple))',
                borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 800, color: 'white',
              }}>M</div>
              <h2>MailFlow</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Email Audience & Campaign Management Platform</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <p>MailFlow is a full-stack email management platform built with React, Node.js, Express, and PostgreSQL.</p>
              <p>Features include audience management with drag-and-drop member import, campaign tracking, weekly reports with CSV export, and side-by-side campaign comparison.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 8 }}>Deployed on Railway · Built for scale</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
