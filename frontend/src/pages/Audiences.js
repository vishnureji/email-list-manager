import React, { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../utils/api';

const COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#a855f7','#ec4899','#3b82f6','#14b8a6','#f97316'];

function parseCsvOrText(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (!lines.length) return [];
  const members = [];
  for (const line of lines) {
    const parts = line.split(/[,\t;]/).map(s => s.trim().replace(/^["']|["']$/g, ''));
    if (!parts[0]) continue;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let email = '', firstName = '', lastName = '';
    for (const p of parts) {
      if (emailRegex.test(p)) { email = p; }
    }
    const nonEmail = parts.filter(p => !emailRegex.test(p) && p);
    if (nonEmail[0]) firstName = nonEmail[0];
    if (nonEmail[1]) lastName = nonEmail[1];
    if (email) members.push({ email, first_name: firstName, last_name: lastName });
  }
  return members;
}

function AudienceModal({ audience, onClose, onSave }) {
  const [form, setForm] = useState({
    name: audience?.name || '',
    description: audience?.description || '',
    color: audience?.color || COLORS[0],
    tags: audience?.tags?.join(', ') || '',
  });
  const [members, setMembers] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const dropRef = useRef();

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const parsed = parseCsvOrText(ev.target.result);
        setMembers(prev => {
          const emails = new Set(prev.map(m => m.email));
          return [...prev, ...parsed.filter(m => !emails.has(m.email))];
        });
      };
      reader.readAsText(file);
    } else {
      const text = e.dataTransfer.getData('text');
      if (text) {
        const parsed = parseCsvOrText(text);
        setMembers(prev => {
          const emails = new Set(prev.map(m => m.email));
          return [...prev, ...parsed.filter(m => !emails.has(m.email))];
        });
      }
    }
  }, []);

  const addManual = () => {
    const email = manualEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (members.find(m => m.email === email)) return;
    setMembers(prev => [...prev, { email, first_name: '', last_name: '' }]);
    setManualEmail('');
  };

  const removeMember = (email) => setMembers(prev => prev.filter(m => m.email !== email));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      if (!audience) payload.members = members;
      const saved = await onSave(payload, members, audience?.id);
      if (!audience && members.length && saved?.id) {
        // Members handled in create; no extra call needed
      }
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
          <h3>{audience ? 'Edit Audience' : 'Create Audience'}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Audience Name *</label>
              <input className="form-control" placeholder="e.g. Newsletter Subscribers" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setForm(p => ({ ...p, color: c }))} style={{
                    width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: form.color === c ? '3px solid white' : '3px solid transparent',
                    boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none',
                    transition: 'all 0.15s',
                  }} />
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" placeholder="What is this audience for?" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma-separated)</label>
            <input className="form-control" placeholder="newsletter, vip, customers" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
          </div>

          {!audience && (
            <>
              <div>
                <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Add Members — Drag & Drop</label>
                <div
                  ref={dropRef}
                  className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <div className="drop-zone-icon">📂</div>
                  <div className="drop-zone-text">Drop a CSV file or paste email list here</div>
                  <div className="drop-zone-sub">Format: email, first_name, last_name (one per line)</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Add Email Manually</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-control" placeholder="email@example.com" value={manualEmail} onChange={e => setManualEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && addManual()} />
                  <button className="btn btn-secondary" onClick={addManual}>Add</button>
                </div>
              </div>

              {members.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="form-label">{members.length} member{members.length !== 1 ? 's' : ''} queued</label>
                    <button className="btn btn-danger btn-sm" onClick={() => setMembers([])}>Clear All</button>
                  </div>
                  <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                    {members.slice(0, 100).map((m, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 12px', borderBottom: i < members.length - 1 ? '1px solid rgba(42,42,74,0.5)' : 'none',
                        fontSize: '0.85rem',
                      }}>
                        <div>
                          <span style={{ color: 'var(--accent)' }}>{m.email}</span>
                          {(m.first_name || m.last_name) && (
                            <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{m.first_name} {m.last_name}</span>
                          )}
                        </div>
                        <button onClick={() => removeMember(m.email)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>✕</button>
                      </div>
                    ))}
                    {members.length > 100 && (
                      <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                        +{members.length - 100} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="loading-spinner" /> : (audience ? 'Save Changes' : 'Create Audience')}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddMembersModal({ audience, onClose, onSave }) {
  const [members, setMembers] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length) {
      const reader = new FileReader();
      reader.onload = ev => { const p = parseCsvOrText(ev.target.result); setMembers(prev => { const s = new Set(prev.map(m => m.email)); return [...prev, ...p.filter(m => !s.has(m.email))]; }); };
      reader.readAsText(files[0]);
    } else {
      const text = e.dataTransfer.getData('text');
      if (text) { const p = parseCsvOrText(text); setMembers(prev => { const s = new Set(prev.map(m => m.email)); return [...prev, ...p.filter(m => !s.has(m.email))]; }); }
    }
  }, []);

  const addManual = () => {
    const email = manualEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (!members.find(m => m.email === email)) setMembers(prev => [...prev, { email, first_name: '', last_name: '' }]);
    setManualEmail('');
  };

  const handleSave = async () => {
    if (!members.length) return;
    setSaving(true);
    try {
      const r = await api.addMembers(audience.id, members);
      setResult(r);
      onSave();
    } catch (e) { } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-md">
        <div className="modal-header">
          <h3>Add Members to "{audience.name}"</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {result ? (
            <div className="alert alert-success">✓ Added {result.added} of {result.total} members (duplicates skipped)</div>
          ) : (
            <>
              <div
                className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <div className="drop-zone-icon">📂</div>
                <div className="drop-zone-text">Drop CSV or text file</div>
                <div className="drop-zone-sub">email, first_name, last_name (comma/tab separated)</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="form-control" placeholder="Add single email..." value={manualEmail} onChange={e => setManualEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && addManual()} />
                <button className="btn btn-secondary" onClick={addManual}>Add</button>
              </div>
              {members.length > 0 && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {members.length} email{members.length !== 1 ? 's' : ''} ready to import
                </div>
              )}
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>{result ? 'Close' : 'Cancel'}</button>
          {!result && <button className="btn btn-primary" onClick={handleSave} disabled={saving || !members.length}>
            {saving ? <span className="loading-spinner" /> : `Import ${members.length} Members`}
          </button>}
        </div>
      </div>
    </div>
  );
}

export default function Audiences() {
  const [audiences, setAudiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editAudience, setEditAudience] = useState(null);
  const [addMembersTo, setAddMembersTo] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.getAudiences();
      setAudiences(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (payload, members, id) => {
    if (id) return await api.updateAudience(id, payload);
    return await api.createAudience({ ...payload, members });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this audience? This cannot be undone.')) return;
    await api.deleteAudience(id);
    load();
  };

  const filtered = audiences.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-content animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audiences</h1>
          <p className="page-subtitle">{audiences.length} audience{audiences.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="page-actions">
          <div className="search-wrapper">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input className="form-control search-input" placeholder="Search audiences..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Audience</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay"><span className="loading-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3>{search ? 'No results found' : 'No audiences yet'}</h3>
          <p>Create your first audience to get started</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>+ Create Audience</button>
        </div>
      ) : (
        <div className="grid grid-3">
          {filtered.map(a => (
            <div key={a.id} className="card card-padded" style={{ borderTop: `3px solid ${a.color}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div className="color-dot" style={{ background: a.color, width: 10, height: 10 }} />
                    <h3 style={{ fontSize: '1rem' }}>{a.name}</h3>
                  </div>
                  {a.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{a.description}</p>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setEditAudience(a)} title="Edit">✎</button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(a.id)} title="Delete">🗑</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'JetBrains Mono', color: a.color }}>{(+a.member_count || 0).toLocaleString()}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--text-secondary)' }}>{(+a.total_members || 0).toLocaleString()}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
                </div>
              </div>

              {a.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {a.tags.map(t => <span key={t} className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{t}</span>)}
                </div>
              )}

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                Created {new Date(a.created_at).toLocaleDateString()}
              </div>

              <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setAddMembersTo(a)}>
                + Add Members
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <AudienceModal
          onClose={() => setShowCreate(false)}
          onSave={async (payload, members) => { await handleSave(payload, members, null); load(); }}
        />
      )}
      {editAudience && (
        <AudienceModal
          audience={editAudience}
          onClose={() => setEditAudience(null)}
          onSave={async (payload, members, id) => { await handleSave(payload, members, id); load(); setEditAudience(null); }}
        />
      )}
      {addMembersTo && (
        <AddMembersModal
          audience={addMembersTo}
          onClose={() => setAddMembersTo(null)}
          onSave={() => { load(); setAddMembersTo(null); }}
        />
      )}
    </div>
  );
}
