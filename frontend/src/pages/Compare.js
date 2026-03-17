import React, { useEffect, useState, useCallback } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { api, exportToCSV } from '../utils/api';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#3b82f6'];

const MetricRow = ({ label, campaigns, field, suffix = '', color, higher = true }) => {
  const values = campaigns.map(c => +c[field] || 0);
  const max = Math.max(...values);
  return (
    <tr>
      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</td>
      {campaigns.map((c, i) => {
        const val = +c[field] || 0;
        const isBest = val === max && max > 0;
        return (
          <td key={i} className="mono" style={{
            color: isBest ? color || 'var(--success)' : 'var(--text-primary)',
            fontWeight: isBest ? 700 : 400,
            fontSize: '0.9rem',
          }}>
            {val.toLocaleString()}{suffix}
            {isBest && <span style={{ marginLeft: 4, fontSize: '0.7rem', color: color || 'var(--success)' }}>▲</span>}
          </td>
        );
      })}
    </tr>
  );
};

export default function CompareCampaigns() {
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [compareData, setCompareData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    api.getCampaigns().then(c => setAllCampaigns(c)).finally(() => setInitialLoading(false));
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleCompare = useCallback(async () => {
    if (selectedIds.length < 2) return;
    setLoading(true);
    try {
      const data = await api.compareCampaigns(selectedIds);
      setCompareData(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [selectedIds]);

  const handleExport = () => {
    const rows = compareData.map(c => ({
      Campaign: c.name,
      Subject: c.subject,
      Audiences: (c.audience_names || []).join('; '),
      Status: c.status,
      'Delivery Date': c.delivery_date ? new Date(c.delivery_date).toLocaleDateString() : '',
      'Total Sent': c.total_sent || 0,
      Delivered: c.delivered || 0,
      Opens: c.opens || 0,
      Clicks: c.clicks || 0,
      Bounces: c.bounces || 0,
      Unsubscribes: c.unsubscribes || 0,
      'CTR (%)': c.ctr || 0,
      'Open Rate (%)': c.open_rate || 0,
      'Bounce Rate (%)': c.bounce_rate || 0,
      'Unsub Rate (%)': c.unsub_rate || 0,
    }));
    exportToCSV(rows, 'campaign-comparison');
  };

  // Chart data
  const barData = ['Sent', 'Delivered', 'Opens', 'Clicks', 'Bounces'].map(metric => {
    const obj = { metric };
    compareData.forEach(c => { obj[c.name?.substring(0, 15)] = +c[metric.toLowerCase()] || 0; });
    return obj;
  });

  const radarData = ['ctr', 'open_rate', 'bounce_rate', 'unsub_rate'].map(key => {
    const labels = { ctr: 'CTR', open_rate: 'Open Rate', bounce_rate: 'Bounce Rate', unsub_rate: 'Unsub Rate' };
    const obj = { metric: labels[key] };
    compareData.forEach(c => { obj[c.name?.substring(0, 15)] = +c[key] || 0; });
    return obj;
  });

  if (initialLoading) return <div className="loading-overlay"><span className="loading-spinner" /></div>;

  return (
    <div className="page-content animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaign Comparison</h1>
          <p className="page-subtitle">Select 2 or more campaigns to compare side-by-side</p>
        </div>
        {compareData.length > 0 && (
          <button className="btn btn-success" onClick={handleExport}>↓ Export CSV</button>
        )}
      </div>

      {/* Campaign selection */}
      <div className="card card-padded" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Select Campaigns</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedIds.length} selected</span>
            <button
              className="btn btn-primary"
              onClick={handleCompare}
              disabled={selectedIds.length < 2 || loading}
            >
              {loading ? <span className="loading-spinner" /> : 'Compare →'}
            </button>
          </div>
        </div>
        {allCampaigns.length === 0 ? (
          <div className="empty-state" style={{ padding: 30 }}>
            <p>No campaigns available</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {allCampaigns.map((c, i) => {
              const isSelected = selectedIds.includes(c.id);
              const color = CHART_COLORS[allCampaigns.indexOf(c) % CHART_COLORS.length];
              return (
                <div
                  key={c.id}
                  onClick={() => toggleSelect(c.id)}
                  style={{
                    padding: '10px 16px',
                    border: `1px solid ${isSelected ? color : 'var(--border)'}`,
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: isSelected ? `${color}15` : 'var(--bg-input)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: 4,
                    background: isSelected ? color : 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', color: 'white', fontWeight: 700, transition: 'all 0.15s',
                  }}>
                    {isSelected ? '✓' : (i + 1)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{c.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      {c.status} • {c.delivery_date ? new Date(c.delivery_date).toLocaleDateString() : 'No date'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparison results */}
      {compareData.length > 0 && (
        <>
          {/* Header cards */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${compareData.length}, 1fr)`, gap: 16, marginBottom: 24 }}>
            {compareData.map((c, i) => (
              <div key={c.id} className="card card-padded" style={{ borderTop: `3px solid ${CHART_COLORS[i % CHART_COLORS.length]}` }}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <h3 style={{ fontSize: '0.95rem' }}>{c.name}</h3>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{c.subject}</div>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 6 }}>
                  {(c.audience_names || []).filter(Boolean).join(', ') || 'No audience'}
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '1.3rem', fontFamily: 'JetBrains Mono', fontWeight: 700, color: CHART_COLORS[i % CHART_COLORS.length] }}>{c.ctr || 0}%</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CTR</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.3rem', fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--success)' }}>{c.open_rate || 0}%</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Open Rate</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Metrics table */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header"><h3>Detailed Metrics</h3></div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Metric</th>
                    {compareData.map((c, i) => (
                      <th key={i} style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>{c.name?.substring(0, 18)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <MetricRow label="Total Sent" campaigns={compareData} field="total_sent" color="var(--accent)" />
                  <MetricRow label="Delivered" campaigns={compareData} field="delivered" color="var(--success)" />
                  <MetricRow label="Opens" campaigns={compareData} field="opens" color="var(--warning)" />
                  <MetricRow label="Unique Opens" campaigns={compareData} field="unique_opens" />
                  <MetricRow label="Clicks" campaigns={compareData} field="clicks" color="var(--cyan)" />
                  <MetricRow label="Unique Clicks" campaigns={compareData} field="unique_clicks" />
                  <MetricRow label="Bounces" campaigns={compareData} field="bounces" color="var(--danger)" higher={false} />
                  <MetricRow label="Unsubscribes" campaigns={compareData} field="unsubscribes" color="var(--pink)" higher={false} />
                  <MetricRow label="CTR" campaigns={compareData} field="ctr" suffix="%" color="var(--purple)" />
                  <MetricRow label="Open Rate" campaigns={compareData} field="open_rate" suffix="%" color="var(--success)" />
                  <MetricRow label="Bounce Rate" campaigns={compareData} field="bounce_rate" suffix="%" higher={false} />
                  <MetricRow label="Unsub Rate" campaigns={compareData} field="unsub_rate" suffix="%" higher={false} />
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-2">
            <div className="card card-padded">
              <h3 style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>Volume Comparison</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="metric" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                  {compareData.map((c, i) => (
                    <Bar key={i} dataKey={c.name?.substring(0, 15)} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[3, 3, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card card-padded">
              <h3 style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>Rate Comparison</h3>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  {compareData.map((c, i) => (
                    <Radar key={i} name={c.name?.substring(0, 15)} dataKey={c.name?.substring(0, 15)}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.15} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {compareData.length === 0 && !loading && selectedIds.length >= 2 && (
        <div className="empty-state">
          <div className="empty-state-icon">⊞</div>
          <h3>Click "Compare" to see results</h3>
        </div>
      )}
    </div>
  );
}
