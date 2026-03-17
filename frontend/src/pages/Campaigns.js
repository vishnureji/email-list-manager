import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../utils/api';

const STATUS_OPTIONS = ['draft', 'scheduled', 'sending', 'sent', 'paused'];

const StatusBadge = ({ status }) => {
  const map = { sent: 'success', draft: 'neutral', scheduled: 'warning', sending: 'info', paused: 'purple' };
  return <span className={`badge badge-${map[status] || 'neutral'}`}>{status}</span>;
};

function CampaignModal({ campaign, audiences, onClose, onSave }) {
  const [form, setForm] = useState({
    name: campaign?.name || '',
    subject: campaign?.subject || '',
    preview_text: campaign?.preview_text || '',
    from_name: campaign?.from_name || '',
    from_email: campaign?.from_email || '',
    status: campaign?.status || 'draft',
    scheduled_at: campaign?.scheduled_at ? campaign.scheduled_at.slice(0, 16) : '',
    audience_ids: campaign?.audience_ids?.filter(Boolean) || [],
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleAudience = (id) => {
    setForm(p => ({
      ...p,
      audience_ids: p.audience_ids.includes(id) ? p.audience_ids.filter(a => a !== id) : [...p.audience_ids, id],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim()) { setError('Name and subject are required'); return; }
    setSaving(true);
    try {
      await onSave({ ...form, scheduled_at: form.scheduled_at || null });
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>{campaign ? 'Edit Campaign' : 'New Campaign'}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Campaign Name *</label>
              <input className="form-control" placeholder="e.g. March Newsletter" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email Subject *</label>
            <input className="form-control" placeholder="Your subject line here" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Preview Text</label>
            <input className="form-control" placeholder="Short preview shown in inbox..." value={form.preview_text} onChange={e => setForm(p => ({ ...p, preview_text: e.target.value }))} />
          </div>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">From Name</label>
              <input className="form-control" placeholder="Your Company" value={form.from_name} onChange={e => setForm(p => ({ ...p, from_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">From Email</label>
              <input className="form-control" type="email" placeholder="hello@yourcompany.com" value={form.from_email} onChange={e => setForm(p => ({ ...p, from_email: e.target.value }))} />
            </div>
          </div>
          {form.status === 'scheduled' && (
            <div className="form-group">
              <label className="form-label">Scheduled Date & Time</label>
              <input className="form-control" type="datetime-local" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Target Audiences</label>
            {audiences.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '10px 0' }}>No audiences available — create one first</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {audiences.map(a => (
                  <div key={a.id} onClick={() => toggleAudience(a.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px',
                    border: `1px solid ${form.audience_ids.includes(a.id) ? a.color : 'var(--border)'}`,
                    borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                    background: form.audience_ids.includes(a.id) ? `${a.color}20` : 'var(--bg-input)',
                    fontSize: '0.85rem',
                  }}>
                    <div className="color-dot" style={{ background: a.color }} />
                    {a.name}
                    {form.audience_ids.includes(a.id) && <span style={{ color: a.color }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="loading-spinner" /> : (campaign ? 'Save Changes' : 'Create Campaign')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportModal({ campaign, onClose, onSave }) {
  const [form, setForm] = useState({
    total_sent: campaign?.total_sent || '',
    delivered: campaign?.delivered || '',
    opens: campaign?.opens || '',
    unique_opens: campaign?.unique_opens || '',
    clicks: campaign?.clicks || '',
    unique_clicks: campaign?.unique_clicks || '',
    bounces: campaign?.bounces || '',
    unsubscribes: campaign?.unsubscribes || '',
    spam_reports: campaign?.spam_reports || '',
    delivery_date: campaign?.delivery_date ? campaign.delivery_date.slice(0, 10) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const ctr = form.delivered > 0 ? ((form.clicks / form.delivered) * 100).toFixed(2) : 0;
  const openRate = form.delivered > 0 ? ((form.opens / form.delivered) * 100).toFixed(2) : 0;
  const bounceRate = form.total_sent > 0 ? ((form.bounces / form.total_sent) * 100).toFixed(2) : 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const Field = ({ label, field, color }) => (
    <div className="form-group">
      <label className="form-label" style={{ color: color || 'var(--text-secondary)' }}>{label}</label>
      <input className="form-control" type="number" min="0" placeholder="0"
        value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: +e.target.value || '' }))} />
    </div>
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div>
            <h3>Update Report Stats</h3>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>{campaign.name}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div className="alert alert-error">{error}</div>}

          {/* Auto-calculated metrics */}
          <div style={{ display: 'flex', gap: 16, padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 8, flexWrap: 'wrap' }}>
            <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CTR (auto)</div><div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--cyan)' }}>{ctr}%</div></div>
            <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Open Rate (auto)</div><div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--success)' }}>{openRate}%</div></div>
            <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bounce Rate (auto)</div><div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--danger)' }}>{bounceRate}%</div></div>
          </div>

          <div className="grid grid-2">
            <Field label="Total Sent" field="total_sent" color="var(--accent)" />
            <Field label="Delivered" field="delivered" color="var(--success)" />
            <Field label="Opens" field="opens" color="var(--warning)" />
            <Field label="Unique Opens" field="unique_opens" />
            <Field label="Clicks" field="clicks" color="var(--cyan)" />
            <Field label="Unique Clicks" field="unique_clicks" />
            <Field label="Bounces" field="bounces" color="var(--danger)" />
            <Field label="Unsubscribes" field="unsubscribes" color="var(--pink)" />
            <Field label="Spam Reports" field="spam_reports" />
            <div className="form-group">
              <label className="form-label">Delivery Date</label>
              <input className="form-control" type="date" value={form.delivery_date} onChange={e => setForm(p => ({ ...p, delivery_date: e.target.value }))} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="loading-spinner" /> : 'Save Stats'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [audiences, setAudiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editCampaign, setEditCampaign] = useState(null);
  const [reportCampaign, setReportCampaign] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const [c, a] = await Promise.all([api.getCampaigns(), api.getAudiences()]);
      setCampaigns(c); setAudiences(a);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (payload, id) => {
    if (id) await api.updateCampaign(id, payload);
    else await api.createCampaign(payload);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    await api.deleteCampaign(id);
    load();
  };

  const handleReportSave = async (data) => {
    await api.updateReport(reportCampaign.id, data);
    load();
  };

  const filtered = campaigns.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.subject?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="page-content animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="page-actions">
          <div className="search-wrapper">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input className="form-control search-input" placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} />
          </div>
          <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 130 }}>
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Campaign</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay"><span className="loading-spinner" /></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Status</th>
                <th>Audiences</th>
                <th>Sent</th>
                <th>Delivered</th>
                <th>Opens</th>
                <th>Clicks</th>
                <th>CTR</th>
                <th>Bounces</th>
                <th>Unsub</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={12} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  {search ? 'No campaigns match your search' : 'No campaigns yet — create one!'}
                </td></tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ maxWidth: 200 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.subject}</div>
                  </td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    {c.audience_names?.filter(Boolean).length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {c.audience_names.filter(Boolean).map((n, i) => <span key={i} className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{n}</span>)}
                      </div>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td className="mono">{(+c.total_sent || 0).toLocaleString()}</td>
                  <td className="mono">{(+c.delivered || 0).toLocaleString()}</td>
                  <td className="mono" style={{ color: 'var(--warning)' }}>{(+c.opens || 0).toLocaleString()}</td>
                  <td className="mono" style={{ color: 'var(--success)' }}>{(+c.clicks || 0).toLocaleString()}</td>
                  <td className="mono" style={{ color: 'var(--cyan)', fontWeight: 600 }}>{c.ctr || 0}%</td>
                  <td className="mono" style={{ color: 'var(--danger)' }}>{(+c.bounces || 0).toLocaleString()}</td>
                  <td className="mono" style={{ color: 'var(--pink)' }}>{(+c.unsubscribes || 0).toLocaleString()}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {c.delivery_date ? new Date(c.delivery_date).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setReportCampaign(c)} title="Update Stats">📊</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditCampaign(c)} title="Edit">✎</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)} title="Delete">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CampaignModal audiences={audiences} onClose={() => setShowCreate(false)} onSave={async (p) => { await handleSave(p, null); }} />
      )}
      {editCampaign && (
        <CampaignModal campaign={editCampaign} audiences={audiences} onClose={() => setEditCampaign(null)} onSave={async (p) => { await handleSave(p, editCampaign.id); setEditCampaign(null); }} />
      )}
      {reportCampaign && (
        <ReportModal campaign={reportCampaign} onClose={() => setReportCampaign(null)} onSave={handleReportSave} />
      )}
    </div>
  );
}
