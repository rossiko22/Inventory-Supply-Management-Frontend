import React, { useEffect, useState } from 'react';

type OrderStatus = 'Requested' | 'Approved' | 'Delivered' | 'Closed';
interface Order {
  id: string; productId: string; companyId: string; warehouseId: string;
  driverId: string; quantity: number; status: number; deliveryDate?: string;
  createdAt?: string; lastModified?: string;
}
interface CreateForm { productId: string; companyId: string; warehouseId: string; driverId: string; quantity: number; deliveryDate: string; }
interface Option { id: string; label: string; }

const STATUS_MAP: Record<number, OrderStatus> = { 0: 'Requested', 1: 'Approved', 2: 'Delivered', 3: 'Closed' };
const STATUS_NEXT: Record<number, number>      = { 0: 1, 1: 2, 2: 3 };
const STATUS_COLOR: Record<number, string>     = { 0: '#f59e0b', 1: '#3b82f6', 2: '#10b981', 3: '#64748b' };

const API = '/api';
const s = {
  wrap:   { padding: '1.5rem' } as React.CSSProperties,
  h1:     { fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.25rem' } as React.CSSProperties,
  table:  { width: '100%', borderCollapse: 'collapse' as const, background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,.07)' },
  th:     { padding: '0.75rem 1rem', background: '#f1f5f9', textAlign: 'left' as const, fontSize: '0.8rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' as const },
  td:     { padding: '0.75rem 1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#334155' },
  btn:    { padding: '0.35rem 0.8rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 } as React.CSSProperties,
  input:  { padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' as const } as React.CSSProperties,
  select: { padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' as const, background: '#fff', cursor: 'pointer' } as React.CSSProperties,
  label:  { display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem', fontWeight: 500 } as React.CSSProperties,
};

async function fetchOptions<T>(path: string, toOption: (item: T) => Option): Promise<Option[]> {
  try {
    const r = await fetch(`${API}${path}`, { credentials: 'include' });
    if (!r.ok) return [];
    return (await r.json() as T[]).map(toOption);
  } catch { return []; }
}

function nameById(options: Option[], id: string) {
  return options.find(o => o.id === id)?.label ?? id.slice(0, 8) + '…';
}

export default function App() {
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [closingOrder, setClosingOrder] = useState<Order | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [form, setForm] = useState<CreateForm>({ productId: '', companyId: '', warehouseId: '', driverId: '', quantity: 1, deliveryDate: '' });
  const [detail, setDetail] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [products,   setProducts]   = useState<Option[]>([]);
  const [companies,  setCompanies]  = useState<Option[]>([]);
  const [warehouses, setWarehouses] = useState<Option[]>([]);
  const [drivers,    setDrivers]    = useState<Option[]>([]);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/orders`, { credentials: 'include' });
      if (!r.ok) throw new Error('Failed to load orders');
      setOrders(await r.json() as Order[]);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    void load();
    void fetchOptions('/products',   (p: any) => ({ id: p.id, label: `${p.name} (${p.sku})` })).then(setProducts);
    void fetchOptions('/companies',  (c: any) => ({ id: c.id, label: c.name })).then(setCompanies);
    void fetchOptions('/warehouses', (w: any) => ({ id: w.id, label: `${w.name} — ${w.city}` })).then(setWarehouses);
    void fetchOptions('/drivers',    (d: any) => ({ id: d.id, label: d.name })).then(setDrivers);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const r = await fetch(`${API}/orders`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error('Create failed');
      setShowCreate(false);
      setForm({ productId: '', companyId: '', warehouseId: '', driverId: '', quantity: 1, deliveryDate: '' });
      void load();
    } catch (e) { alert(String(e)); }
  }

  async function setStatus(orderId: string, status: number) {
    const r = await fetch(`${API}/orders/status`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, status }) });
    if (!r.ok) throw new Error('Status update failed');
  }

  async function advanceStatus(order: Order) {
    const next = STATUS_NEXT[order.status];
    if (next === undefined) return;
    // Delivered → Closed requires a document upload first.
    if (order.status === 2 && next === 3) {
      setClosingOrder(order);
      setUploadFile(null);
      return;
    }
    try {
      await setStatus(order.id, next);
      void load();
    } catch (e) { alert(String(e)); }
  }

  async function handleUploadAndClose(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile || !closingOrder) return;

    // Backend (DocumentStorageService) only accepts non-empty PDFs.
    if (uploadFile.size === 0) {
      alert('The selected file is empty. Please choose a non-empty PDF.');
      return;
    }
    const isPdf = uploadFile.type === 'application/pdf'
      || uploadFile.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      alert('Only PDF documents are accepted.');
      return;
    }

    setUploadBusy(true);
    try {
      const fd = new FormData();
      fd.append('File', uploadFile, uploadFile.name);
      fd.append('OrderId', closingOrder.id);
      const r = await fetch(`${API}/orders/upload-document`, { method: 'POST', credentials: 'include', body: fd });
      if (!r.ok) {
        const text = await r.text().catch(() => '');
        throw new Error(text || `Upload failed (${r.status})`);
      }
      await setStatus(closingOrder.id, 3);
      setClosingOrder(null);
      setUploadFile(null);
      void load();
    } catch (e) { alert(String(e)); }
    finally { setUploadBusy(false); }
  }

  async function openDetail(id: string) {
    setDetailLoading(true);
    setDetail(null);
    try {
      const r = await fetch(`${API}/orders/${id}`, { credentials: 'include' });
      if (!r.ok) throw new Error('Failed to fetch order');
      setDetail(await r.json() as Order);
    } catch (e) { alert(String(e)); }
    finally { setDetailLoading(false); }
  }

  const field = (key: keyof CreateForm, label: string, options: Option[]) => (
    <div key={key} style={{ marginBottom: '0.875rem' }}>
      <label style={s.label}>{label}</label>
      <select
        style={s.select}
        value={form[key] as string}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        required
      >
        <option value="">— select —</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div style={s.wrap}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <h1 style={{ ...s.h1, marginBottom: 0 }}>Orders</h1>
        <button style={{ ...s.btn, background: '#3b82f6', color: '#fff' }} onClick={() => setShowCreate(true)}>+ New Order</button>
      </div>

      {error && <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>}
      {loading && <p style={{ color: '#64748b' }}>Loading…</p>}

      {!loading && !error && (
        <table style={s.table}>
          <thead>
            <tr>{['Product', 'Company', 'Warehouse', 'Driver', 'Qty', 'Status', 'Delivery', 'Action'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td style={s.td}>{nameById(products,   o.productId)}</td>
                <td style={s.td}>{nameById(companies,  o.companyId)}</td>
                <td style={s.td}>{nameById(warehouses, o.warehouseId)}</td>
                <td style={s.td}>{nameById(drivers,    o.driverId)}</td>
                <td style={s.td}>{o.quantity}</td>
                <td style={s.td}>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: 999, background: STATUS_COLOR[o.status] + '22', color: STATUS_COLOR[o.status], fontWeight: 600, fontSize: '0.8rem' }}>
                    {STATUS_MAP[o.status]}
                  </span>
                </td>
                <td style={s.td}>{o.deliveryDate ? o.deliveryDate.slice(0, 10) : '—'}</td>
                <td style={s.td}>
                  <button style={{ ...s.btn, background: '#f1f5f9', color: '#334155', marginRight: '0.4rem' }} onClick={() => void openDetail(o.id)}>View</button>
                  {STATUS_NEXT[o.status] !== undefined && (
                    o.status === 2 ? (
                      <button style={{ ...s.btn, background: '#ede9fe', color: '#6d28d9' }} onClick={() => advanceStatus(o)}>
                        📎 Upload & Close
                      </button>
                    ) : (
                      <button style={{ ...s.btn, background: '#e0f2fe', color: '#0369a1' }} onClick={() => advanceStatus(o)}>
                        → {STATUS_MAP[STATUS_NEXT[o.status]]}
                      </button>
                    )
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', color: '#94a3b8' }}>No orders found.</td></tr>}
          </tbody>
        </table>
      )}

      {/* Create Order Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', width: 480, boxShadow: '0 8px 40px rgba(0,0,0,.15)', maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ fontWeight: 700, marginBottom: '1.25rem', color: '#1e293b' }}>Create Order</h2>
            <form onSubmit={handleCreate}>
              {field('productId',   'Product',   products)}
              {field('companyId',   'Company',   companies)}
              {field('warehouseId', 'Warehouse', warehouses)}
              {field('driverId',    'Driver',    drivers)}
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={s.label}>Quantity</label>
                <input style={s.input} type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: +e.target.value }))} required />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={s.label}>Delivery Date</label>
                <input style={s.input} type="date" value={form.deliveryDate} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" style={{ ...s.btn, background: '#e2e8f0', color: '#334155' }} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" style={{ ...s.btn, background: '#3b82f6', color: '#fff' }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload & Close Modal (Delivered → Closed requires a document) */}
      {closingOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', width: 440, boxShadow: '0 8px 40px rgba(0,0,0,.15)' }}>
            <h2 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>Close Order</h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Upload a delivery document to close <strong>{nameById(products, closingOrder.productId)}</strong> for <strong>{nameById(companies, closingOrder.companyId)}</strong>. The order will move to <strong>Closed</strong> once the upload succeeds.
            </p>
            <form onSubmit={handleUploadAndClose}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={s.label}>Document (PDF)</label>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                  required
                  style={{ fontSize: '0.9rem' }}
                />
                {uploadFile && (
                  <p style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#64748b' }}>
                    {uploadFile.name} · {(uploadFile.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" style={{ ...s.btn, background: '#e2e8f0', color: '#334155' }} onClick={() => { setClosingOrder(null); setUploadFile(null); }} disabled={uploadBusy}>Cancel</button>
                <button type="submit" style={{ ...s.btn, background: '#6d28d9', color: '#fff' }} disabled={!uploadFile || uploadBusy}>
                  {uploadBusy ? 'Uploading…' : 'Upload & Close'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {(detail || detailLoading) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', width: 480, boxShadow: '0 8px 40px rgba(0,0,0,.15)', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>Order Detail</h2>
              <button onClick={() => setDetail(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}>×</button>
            </div>
            {detailLoading && <p style={{ color: '#64748b' }}>Loading…</p>}
            {detail && (
              <dl style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: '0.5rem', columnGap: '0.75rem', fontSize: '0.875rem' }}>
                <dt style={{ color: '#64748b' }}>ID</dt><dd style={{ margin: 0 }}><code>{detail.id}</code></dd>
                <dt style={{ color: '#64748b' }}>Product</dt><dd style={{ margin: 0 }}>{nameById(products, detail.productId)}</dd>
                <dt style={{ color: '#64748b' }}>Company</dt><dd style={{ margin: 0 }}>{nameById(companies, detail.companyId)}</dd>
                <dt style={{ color: '#64748b' }}>Warehouse</dt><dd style={{ margin: 0 }}>{nameById(warehouses, detail.warehouseId)}</dd>
                <dt style={{ color: '#64748b' }}>Driver</dt><dd style={{ margin: 0 }}>{nameById(drivers, detail.driverId)}</dd>
                <dt style={{ color: '#64748b' }}>Quantity</dt><dd style={{ margin: 0 }}>{detail.quantity}</dd>
                <dt style={{ color: '#64748b' }}>Status</dt>
                <dd style={{ margin: 0 }}>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: 999, background: STATUS_COLOR[detail.status] + '22', color: STATUS_COLOR[detail.status], fontWeight: 600 }}>
                    {STATUS_MAP[detail.status]}
                  </span>
                </dd>
                <dt style={{ color: '#64748b' }}>Delivery</dt><dd style={{ margin: 0 }}>{detail.deliveryDate ? detail.deliveryDate.slice(0, 10) : '—'}</dd>
                {detail.createdAt && <><dt style={{ color: '#64748b' }}>Created</dt><dd style={{ margin: 0 }}>{new Date(detail.createdAt).toLocaleString()}</dd></>}
                {detail.lastModified && <><dt style={{ color: '#64748b' }}>Modified</dt><dd style={{ margin: 0 }}>{new Date(detail.lastModified).toLocaleString()}</dd></>}
              </dl>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button style={{ ...s.btn, background: '#e2e8f0', color: '#334155' }} onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
