import React, { useEffect, useState, useCallback } from 'react';
import { api, exportToCSV } from '../utils/api';

const MetricCell = ({ value, suffix = '', color }) => (
  <td className="mono" style={{ color: color || 'inherit' }}>
    {value !== null && value !== undefined ? (+value || 0).toLocaleString() + suffix : '—'}
  </td>
);

export default function WeeklyReport() {
  const [data, setData] = useState([]);
  const [audiences, setAudiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audienceFilter, setAudienceFilter] = useState('');
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().slice(0, 10);
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (weekStart) params.week_start = weekStart;
      if (audienceFilter) params.audience_id = audienceFilter;
      const [reportData, audData] = await Promise.all([api.getWeeklyReport(params), api.getAudiences()]);
      setData(reportData);
      setAudiences(audData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [weekStart, audienceFilter]);

  useEffect(() => { load(); }, [load]);

  // Group by audience
  const byAudience = data.reduce((acc, row) => {
    const key = row.audience_id;
    if (!acc[key]) acc[key] = { audience_name: row.audience_name, color: row.audience_color, rows: [] };
    acc[key].rows.push(row);
    return acc;
  }, {});

  const handleExport = () => {
    const rows = data.map(r => ({
      Campaign: r.campaign_name,
      Subject: r.subject,
      Audience: r.audience_name,
      Status: r.status,
      'Delivery Date': r.delivery_date ? new Date(r.delivery_date).toLocaleDateString() : '',
      'Total Sent': r.total_sent || 0,
      Delivered: r.delivered || 0,
      Opens: r.opens || 0,
      'Unique Opens': r.unique_opens || 0,
      Clicks: r.clicks || 0,
      'Unique Clicks': r.unique_clicks || 0,
      Bounces: r.bounces || 0,
      Unsubscribes: r.unsubscribes || 0,
      'CTR (%)': r.ctr || 0,
      'Open Rate (%)': r.open_rate || 0,
      'Bounce Rate (%)': r.bounce_rate || 0,
    }));
    const weekLabel = weekStart ? weekStart : 'all-time';
    exportToCSV(rows, `weekly-report-${weekLabel}`);
  };

  // Summary totals
  const totals = data.reduce((acc, r) => ({
    total_sent: acc.total_sent + (+r.total_sent || 0),
    delivered: acc.delivered + (+r.delivered || 0),
    opens: acc.opens + (+r.opens || 0),
    clicks: acc.clicks + (+r.clicks || 0),
    bounces: acc.bounces + (+r.bounces || 0),
    unsubscribes: acc.unsubscribes + (+r.unsubscribes || 0),
  }), { total_sent: 0, delivered: 0, opens: 0, clicks: 0, bounces: 0, unsubscribes: 0 });

  const totalCtr = totals.delivered > 0 ? ((totals.clicks / totals.delivered) * 100).toFixed(2) : 0;
  const totalOpenRate = totals.delivered > 0 ? ((totals.opens / totals.delivered) * 100).toFixed(2) : 0;

  return (
    <div className="page-content animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Weekly Report</h1>
          <p className="page-subtitle">Campaign performance grouped by audience</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-success" onClick={handleExport} disabled={data.length === 0}>
            ↓ Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card card-padded" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 180 }}>
            <label className="form-label">Week Starting</label>
            <input className="form-control" type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 180 }}>
            <label className="form-label">Filter by Audience</label>
            <select className="form-control" value={audienceFilter} onChange={e => setAudienceFilter(e.target.value)}>
              <option value="">All Audiences</option>
              {audiences.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={load}>Apply</button>
          <button className="btn btn-secondary" onClick={() => { setAudienceFilter(''); setWeekStart(''); }}>Clear</button>
        </div>
      </div>

      {/* Summary bar */}
      {data.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Sent', value: totals.total_sent, color: 'var(--accent)' },
            { label: 'Delivered', value: totals.delivered, color: 'var(--success)' },
            { label: 'Opens', value: totals.opens, color: 'var(--warning)' },
            { label: 'Clicks', value: totals.clicks, color: 'var(--cyan)' },
            { label: 'CTR', value: totalCtr, suffix: '%', color: 'var(--purple)' },
            { label: 'Open Rate', value: totalOpenRate, suffix: '%', color: 'var(--info)' },
            { label: 'Bounces', value: totals.bounces, color: 'var(--danger)' },
            { label: 'Unsubs', value: totals.unsubscribes, color: 'var(--pink)' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '10px 16px', background: 'var(--bg-card)',
              border: '1px solid var(--border)', borderRadius: 8, flex: '1 1 auto', minWidth: 100,
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '1.1rem', color: s.color }}>
                {(+s.value || 0).toLocaleString()}{s.suffix || ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loading-overlay"><span className="loading-spinner" /></div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <h3>No data for this period</h3>
          <p>Try changing the date range or audience filter</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(byAudience).map(([audId, group]) => (
            <div key={audId} className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: group.color }} />
                  <h3>{group.audience_name}</h3>
                  <span className="badge badge-neutral">{group.rows.length} campaign{group.rows.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Status</th>
                      <th>Delivery Date</th>
                      <th>Sent</th>
                      <th>Delivered</th>
                      <th>Opens</th>
                      <th>Unique Opens</th>
                      <th>Clicks</th>
                      <th>Bounces</th>
                      <th>Unsubs</th>
                      <th>CTR</th>
                      <th>Open Rate</th>
                      <th>Bounce Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((r, i) => (
                      <tr key={i}>
                        <td style={{ maxWidth: 180 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.campaign_name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.subject}</div>
                        </td>
                        <td><span className={`badge badge-${r.status === 'sent' ? 'success' : 'neutral'}`}>{r.status}</span></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {r.delivery_date ? new Date(r.delivery_date).toLocaleDateString() : '—'}
                        </td>
                        <MetricCell value={r.total_sent} />
                        <MetricCell value={r.delivered} color="var(--success)" />
                        <MetricCell value={r.opens} color="var(--warning)" />
                        <MetricCell value={r.unique_opens} />
                        <MetricCell value={r.clicks} color="var(--cyan)" />
                        <MetricCell value={r.bounces} color="var(--danger)" />
                        <MetricCell value={r.unsubscribes} color="var(--pink)" />
                        <td className="mono" style={{ color: 'var(--purple)', fontWeight: 600 }}>{r.ctr || 0}%</td>
                        <td className="mono" style={{ color: 'var(--success)' }}>{r.open_rate || 0}%</td>
                        <td className="mono" style={{ color: 'var(--danger)' }}>{r.bounce_rate || 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
