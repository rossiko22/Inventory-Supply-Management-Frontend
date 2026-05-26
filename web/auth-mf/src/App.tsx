import React, { useState } from 'react';

interface AuthUser { id: string; email: string; name: string; role: 'MANAGER' | 'WORKER'; }
interface Props { onLogin?: (user: AuthUser) => void; }

type Mode = 'login' | 'register';

const API = '/api/auth';

const card: React.CSSProperties = {
  background: '#fff', borderRadius: 12, padding: '2.5rem',
  boxShadow: '0 4px 24px rgba(0,0,0,.08)', width: 420,
};
const input: React.CSSProperties = {
  width: '100%', padding: '0.625rem 0.875rem', border: '1px solid #cbd5e1',
  borderRadius: 8, fontSize: '0.95rem', outline: 'none', marginTop: '0.25rem',
  boxSizing: 'border-box',
};
const btn: React.CSSProperties = {
  width: '100%', padding: '0.75rem', background: '#3b82f6', color: '#fff',
  border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 600,
  cursor: 'pointer', marginTop: '1rem',
};
const tabBtn = (active: boolean): React.CSSProperties => ({
  flex: 1, padding: '0.6rem', borderRadius: 8, border: 'none', cursor: 'pointer',
  background: active ? '#3b82f6' : '#e2e8f0', color: active ? '#fff' : '#475569',
  fontWeight: active ? 600 : 500, fontSize: '0.9rem',
});
const label: React.CSSProperties = { display: 'block', fontSize: '0.875rem', color: '#475569', fontWeight: 500 };

export default function App({ onLogin }: Props) {
  const [mode, setMode]         = useState<Mode>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [role, setRole]         = useState<'MANAGER' | 'WORKER'>('WORKER');
  const [error, setError]       = useState('');
  const [info, setInfo]         = useState('');
  const [loading, setLoading]   = useState(false);

  function reset() {
    setError(''); setInfo('');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(data.message ?? 'Login failed');
      }
      const user = await res.json() as AuthUser;
      localStorage.setItem('mf_user', JSON.stringify(user));
      onLogin?.(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const res = await fetch(`${API}/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(data.message ?? 'Registration failed');
      }
      setInfo('Account created. Please sign in.');
      setMode('login');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
      <div style={card}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1e293b' }}>
          Inventory System
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button type="button" style={tabBtn(mode === 'login')}    onClick={() => { setMode('login'); reset(); }}>Login</button>
          <button type="button" style={tabBtn(mode === 'register')} onClick={() => { setMode('register'); reset(); }}>Register</button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
        {info && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', color: '#16a34a', fontSize: '0.875rem' }}>
            {info}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={label}>Email</label>
              <input style={input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={label}>Password</label>
              <input style={input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button style={btn} type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={label}>Full name</label>
              <input style={input} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Alice Doe" required autoFocus />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={label}>Email</label>
              <input style={input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={label}>Password</label>
              <input style={input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required />
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={label}>Role</label>
              <select style={input} value={role} onChange={e => setRole(e.target.value as 'MANAGER' | 'WORKER')}>
                <option value="WORKER">WORKER</option>
                <option value="MANAGER">MANAGER</option>
              </select>
            </div>
            <button style={btn} type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
