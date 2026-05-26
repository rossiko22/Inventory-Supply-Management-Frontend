import React, { useEffect, useState } from 'react';

interface Company { id: string; name: string; email: string; phone: string; contact: string; }
type Form = Omit<Company, 'id'>;

const API = '/api/companies';
const s = {
  wrap:  { padding: '1.5rem' } as React.CSSProperties,
  h1:    { fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.25rem' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,.07)' },
  th:    { padding: '0.75rem 1rem', background: '#f1f5f9', textAlign: 'left' as const, fontSize: '0.8rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' as const },
  td:    { padding: '0.75rem 1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#334155' },
  btn:   { padding: '0.4rem 0.9rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 } as React.CSSProperties,
  input: { padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.9rem', width: '100%' } as React.CSSProperties,
};

const EMPTY: Form = { name: '', email: '', phone: '', contact: '' };

export default function App() {
  const [items, setItems]       = useState<Company[]>([]);
  const [total, setTotal]       = useState<number | null>(null);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Company | null>(null);
  const [form, setForm]         = useState<Form>(EMPTY);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(API, { credentials: 'include' });
      setItems(await r.json() as Company[]);
    } finally { setLoading(false); }
  }

  async function loadTotal() {
    try {
      const r = await fetch(`${API}/total`, { credentials: 'include' });
      if (!r.ok) return;
      const data = await r.json() as { totalNumberOfCompanies?: number };
      setTotal(data.totalNumberOfCompanies ?? null);
    } catch { /* non-critical */ }
  }

  useEffect(() => { void load(); void loadTotal(); }, []);

  function openCreate() { setEditing(null); setForm(EMPTY); setShowForm(true); }
  function openEdit(c: Company) { setEditing(c); setForm({ name: c.name, email: c.email, phone: c.phone, contact: c.contact }); setShowForm(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const url = editing ? `${API}/${editing.id}` : API;
    const r   = await fetch(url, { method: editing ? 'PUT' : 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!r.ok) { alert('Save failed'); return; }
    setShowForm(false);
    void load(); void loadTotal();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this company?')) return;
    await fetch(`${API}/${id}`, { method: 'DELETE', credentials: 'include' });
    void load(); void loadTotal();
  }

  const FIELDS: [keyof Form, string, string][] = [
    ['name', 'Name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'text'], ['contact', 'Contact Person', 'text'],
  ];

  return (
    <div style={s.wrap}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
          <h1 style={{ ...s.h1, marginBottom: 0 }}>Companies</h1>
          {total !== null && (
            <span style={{ background: '#e0e7ff', color: '#3730a3', borderRadius: 999, padding: '0.2rem 0.7rem', fontSize: '0.8rem', fontWeight: 600 }}>
              Total: {total}
            </span>
          )}
        </div>
        <button style={{ ...s.btn, background: '#3b82f6', color: '#fff' }} onClick={openCreate}>+ New Company</button>
      </div>

      {loading && <p style={{ color: '#64748b' }}>Loading…</p>}

      {!loading && (
        <table style={s.table}>
          <thead>
            <tr>{['Name', 'Email', 'Phone', 'Contact', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.map(c => (
              <tr key={c.id}>
                <td style={s.td}>{c.name}</td>
                <td style={s.td}>{c.email}</td>
                <td style={s.td}>{c.phone}</td>
                <td style={s.td}>{c.contact}</td>
                <td style={s.td}>
                  <button style={{ ...s.btn, background: '#e2e8f0', color: '#334155', marginRight: '0.5rem' }} onClick={() => openEdit(c)}>Edit</button>
                  <button style={{ ...s.btn, background: '#fef2f2', color: '#dc2626' }} onClick={() => handleDelete(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', color: '#94a3b8' }}>No companies found.</td></tr>}
          </tbody>
        </table>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', width: 440, boxShadow: '0 8px 40px rgba(0,0,0,.15)' }}>
            <h2 style={{ fontWeight: 700, marginBottom: '1.25rem', color: '#1e293b' }}>{editing ? 'Edit Company' : 'New Company'}</h2>
            <form onSubmit={handleSave}>
              {FIELDS.map(([k, lbl, type]) => (
                <div key={k} style={{ marginBottom: '0.875rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem' }}>{lbl}</label>
                  <input style={s.input} type={type} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} required />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button type="button" style={{ ...s.btn, background: '#e2e8f0', color: '#334155' }} onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" style={{ ...s.btn, background: '#3b82f6', color: '#fff' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
