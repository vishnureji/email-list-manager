import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { api } from '../utils/api';

const StatusBadge = ({ status }) => {
  const map = { sent: 'success', draft: 'neutral', scheduled: 'warning', sending: 'info' };
  return <span className={`badge badge-${map[status] || 'neutral'}`}>{status}</span>;
};

const StatCard = ({ label, value, sub, color, prefix = '', suffix = '' }) => (
  <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <div className="stat-label">{label}</div>
    <div className="stat-value mono" style={{ color }}>{prefix}{(value || 0).toLocaleString()}{suffix}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const d = await api.getDashboard();
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="loading-overlay"><span className="loading-spinner" /></div>;

  const stats = data?.stats || {};
  const campaigns = data?.campaigns || {};
  const audiences = data?.audiences || {};
  const recent = data?.recent_campaigns || [];

  const chartData = recent.map(c => ({
    name: c.name?.substring(0, 12) + (c.name?.length > 12 ? '…' : ''),
    Sent: c.total_sent || 0,
    Opens: c.opens || 0,
    Clicks: c.clicks || 0,
    Bounces: c.bounces || 0,
  }));

  return (
    <div className="page-content animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your email marketing performance</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/campaigns')}>View Campaigns</button>
          <button className="btn btn-primary" onClick={() => navigate('/campaigns')}>+ New Campaign</button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Total Campaigns" value={+campaigns.total || 0} sub={`${campaigns.sent || 0} sent`} color="var(--accent)" />
        <StatCard label="Audiences" value={+audiences.total || 0} sub="Active lists" color="var(--cyan)" />
        <StatCard label="Total Delivered" value={+stats.total_delivered || 0} sub={`of ${(+stats.total_sent || 0).toLocaleString()} sent`} color="var(--success)" />
        <StatCard label="Avg. Open Rate" value={+stats.avg_open_rate || 0} suffix="%" sub="across all campaigns" color="var(--warning)" />
      </div>

      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        <StatCard label="Total Opens" value={+stats.total_opens || 0} color="var(--purple)" />
        <StatCard label="Total Clicks" value={+stats.total_clicks || 0} color="var(--info)" />
        <StatCard label="Avg. CTR" value={+stats.avg_ctr || 0} suffix="%" color="var(--pink)" />
        <StatCard label="Bounces" value={+stats.total_bounces || 0} color="var(--danger)" />
      </div>

      {/* Charts */}
      <div className="grid grid-2" style={{ marginBottom: 28 }}>
        <div className="card card-padded">
          <h3 style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>Campaign Performance</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} labelStyle={{ color: 'var(--text-primary)' }} />
                <Bar dataKey="Sent" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Opens" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Clicks" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state-icon">📊</div>
              <p>No campaign data yet</p>
            </div>
          )}
        </div>

        <div className="card card-padded">
          <h3 style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>Engagement Trend</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
                <Line type="monotone" dataKey="Opens" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Clicks" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Bounces" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state-icon">📈</div>
              <p>No trend data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent campaigns */}
      <div className="card">
        <div className="card-header">
          <h3>Recent Campaigns</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/campaigns')}>View All →</button>
        </div>
        {recent.length > 0 ? (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Sent</th>
                  <th>Delivered</th>
                  <th>Opens</th>
                  <th>Clicks</th>
                  <th>CTR</th>
                  <th>Bounces</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500, maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    </td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="mono">{(c.total_sent || 0).toLocaleString()}</td>
                    <td className="mono">{(c.delivered || 0).toLocaleString()}</td>
                    <td className="mono">{(c.opens || 0).toLocaleString()}</td>
                    <td className="mono">{(c.clicks || 0).toLocaleString()}</td>
                    <td className="mono" style={{ color: 'var(--cyan)' }}>{c.ctr || 0}%</td>
                    <td className="mono" style={{ color: 'var(--danger)' }}>{(c.bounces || 0).toLocaleString()}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {c.delivery_date ? new Date(c.delivery_date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📧</div>
            <h3>No campaigns yet</h3>
            <p>Create your first campaign to see data here</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/campaigns')}>+ New Campaign</button>
          </div>
        )}
      </div>
    </div>
  );
}
