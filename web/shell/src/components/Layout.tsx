import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthUser } from '../auth';
import NotificationsPanel from './NotificationsPanel';

const NAV = [
  { path: '/warehouses', label: 'Warehouses',  icon: '🏭' },
  { path: '/inventory',  label: 'Stock',        icon: '📦' },
  { path: '/orders',     label: 'Orders',       icon: '📋' },
  { path: '/companies',  label: 'Companies',    icon: '🏢' },
  { path: '/fleet',      label: 'Fleet',        icon: '🚚' },
  { path: '/products',   label: 'Products',     icon: '🛍️' },
];

interface Props {
  user: AuthUser;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function Layout({ user, onLogout, children }: Props) {
  const { pathname } = useLocation();
  const current = NAV.find(n => pathname.startsWith(n.path))?.label ?? 'Dashboard';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 220,
        background: '#1e293b',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 0',
        flexShrink: 0,
      }}>
        <div style={{ padding: '0 1.25rem 1.5rem', borderBottom: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            {user.role}
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user.name}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.125rem' }}>{user.email}</div>
        </div>

        <nav style={{ flex: 1, paddingTop: '0.75rem' }}>
          {NAV.map(({ path, label, icon }) => {
            const active = pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.625rem 1.25rem',
                  textDecoration: 'none',
                  color: active ? '#f8fafc' : '#94a3b8',
                  background: active ? '#334155' : 'transparent',
                  fontWeight: active ? 600 : 400,
                  fontSize: '0.9rem',
                  borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <span>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={onLogout}
          style={{
            margin: '1rem 1.25rem 0',
            padding: '0.5rem',
            background: '#334155',
            color: '#f8fafc',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Logout
        </button>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          background: '#1e293b',
          color: '#f8fafc',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #334155',
        }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{current}</h2>
          <NotificationsPanel />
        </header>
        <div style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
