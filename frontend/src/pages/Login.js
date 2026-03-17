import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(form);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'absolute', width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        borderRadius: '50%', top: -100, left: -100, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)',
        borderRadius: '50%', bottom: -50, right: -50, pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', animation: 'fadeIn 0.4s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, var(--accent), var(--purple))',
            borderRadius: 16, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: 'white',
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          }}>M</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 6 }}>MailFlow</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sign in to your admin account</p>
        </div>

        {/* Form card */}
        <div className="card" style={{ padding: 32, background: 'var(--bg-card)' }}>
          {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                placeholder="admin"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                autoFocus
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              {loading ? <span className="loading-spinner" /> : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Default credentials: <span style={{ color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>admin / admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
