import React, { useState } from 'react';

export default function Navbar({ user, cartCount = 0, onLogout, onNavigate, activePage }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const links = [
    { id: 'market',   label: 'Marketplace' },
    { id: 'orders',   label: 'My Orders'   },
    { id: 'insights', label: 'Insights'    },
    { id: 'ai',       label: 'AI Assistant'},
  ];

  return (
    <nav style={S.nav}>
      <div style={S.brand} onClick={() => onNavigate('market')}>
        <span style={S.brandText}>AGRI<span style={S.brandAccent}>-AI</span></span>
        <span style={S.brandSub}>Marketplace</span>
      </div>

      <div style={S.links}>
        {links.map(l => (
          <button key={l.id} style={{ ...S.link, ...(activePage === l.id ? S.linkActive : {}) }}
            onClick={() => onNavigate(l.id)}>
            {l.label}
          </button>
        ))}
      </div>

      <div style={S.right}>
        <button style={S.cartBtn} onClick={() => onNavigate('cart')}>
          🧺 Cart
          {cartCount > 0 && <span style={S.cartBadge}>{cartCount}</span>}
        </button>

        <div style={S.userMenu} onClick={() => setMenuOpen(!menuOpen)}>
          <div style={S.avatar}>{initials}</div>
          <span style={S.userName}>{user?.name?.split(' ')[0] || 'User'}</span>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>▼</span>

          {menuOpen && (
            <div style={S.dropdown} onClick={e => e.stopPropagation()}>
              <div style={S.dropdownHeader}>
                <div style={S.dropdownName}>{user?.name}</div>
                <div style={S.dropdownEmail}>{user?.email}</div>
                <div style={S.dropdownRole}>🛒 Buyer Account</div>
              </div>
              <button style={S.dropdownItem} onClick={() => { onNavigate('profile'); setMenuOpen(false); }}>👤 My Profile</button>
              <button style={S.dropdownItem} onClick={() => { onNavigate('orders'); setMenuOpen(false); }}>📦 My Orders</button>
              <div style={S.dropdownDivider} />
              <button style={{ ...S.dropdownItem, color: '#dc2626' }} onClick={onLogout}>← Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

const S = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 32px', height: 60,
    background: 'white', borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    fontFamily: "'Nunito','Segoe UI',sans-serif",
  },
  brand: { display: 'flex', alignItems: 'baseline', gap: 6, cursor: 'pointer' },
  brandText: { fontSize: 20, fontWeight: 800, letterSpacing: 1.5, color: '#111827' },
  brandAccent: { color: '#22c55e' },
  brandSub: { fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 },

  links: { display: 'flex', gap: 4 },
  link: { background: 'none', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.2s' },
  linkActive: { color: '#22c55e', background: '#f0fdf4' },

  right: { display: 'flex', alignItems: 'center', gap: 14 },
  cartBtn: { position: 'relative', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '7px 16px', fontSize: 13, fontWeight: 700, color: '#16a34a', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 },
  cartBadge: { position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' },

  userMenu: { position: 'relative', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 10px', borderRadius: 10, transition: 'background 0.2s' },
  avatar: { width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 12 },
  userName: { fontSize: 13, fontWeight: 700, color: '#374151' },

  dropdown: { position: 'absolute', top: '110%', right: 0, background: 'white', borderRadius: 14, boxShadow: '0 12px 36px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb', minWidth: 220, zIndex: 200, overflow: 'hidden' },
  dropdownHeader: { padding: '14px 16px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' },
  dropdownName: { fontSize: 14, fontWeight: 800, color: '#111827' },
  dropdownEmail: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  dropdownRole: { fontSize: 11, color: '#22c55e', fontWeight: 700, marginTop: 4 },
  dropdownItem: { display: 'block', width: '100%', textAlign: 'left', padding: '11px 16px', border: 'none', background: 'none', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' },
  dropdownDivider: { height: 1, background: '#f3f4f6', margin: '4px 0' },
};