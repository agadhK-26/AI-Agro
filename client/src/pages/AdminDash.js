import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API = 'http://localhost:5000/api';
const token = () => localStorage.getItem('agri_token');
const authFetch = (url, opts = {}) =>
  fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(opts.headers || {}) } });

export default function AdminDash({ onLogout }) {
  const [activeTab,    setActiveTab]    = useState('overview');
  const [products,     setProducts]     = useState([]);
  const [orders,       setOrders]       = useState([]);
  const [notification, setNotification] = useState('');
  const [loading,      setLoading]      = useState(false);

  const notify = (msg) => { setNotification(msg); setTimeout(() => setNotification(''), 3000); };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/products`);
      const d = await r.json();
      if (d.success) setProducts(d.products);
    } catch { notify('Failed to load products.'); }
    finally  { setLoading(false); }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const r = await authFetch(`${API}/orders/admin/all`);
      const d = await r.json();
      if (d.success) setOrders(d.orders);
    } catch {}
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [fetchProducts, fetchOrders]);

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      const r = await authFetch(`${API}/products/${id}`, { method: 'DELETE' });
      const d = await r.json();
      if (d.success) { notify('Product deleted.'); fetchProducts(); }
      else notify(`⚠️ ${d.message}`);
    } catch { notify('Failed to delete.'); }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      const r = await authFetch(`${API}/orders/admin/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
      const d = await r.json();
      if (d.success) { notify(`Order ${id} updated to ${status}.`); fetchOrders(); }
    } catch { notify('Failed to update order.'); }
  };

  const navItems = [
    { id: 'overview',  icon: '▦',  label: 'Overview'      },
    { id: 'products',  icon: '🌿', label: 'All Listings'   },
    { id: 'orders',    icon: '📦', label: 'All Orders'     },
    { id: 'users',     icon: '👥', label: 'Users'          },
  ];

  const totalRevenue  = orders.reduce((s, o) => s + parseFloat(o.grand_total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const activeListings = products.filter(p => p.status === 'active').length;

  const revenueByMonth = orders.reduce((acc, o) => {
    const m = new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short' });
    const existing = acc.find(a => a.month === m);
    if (existing) existing.revenue += parseFloat(o.grand_total || 0);
    else acc.push({ month: m, revenue: parseFloat(o.grand_total || 0) });
    return acc;
  }, []);

  const ordersByStatus = [
    { status: 'Pending',   count: orders.filter(o => o.status === 'pending').length,   fill: '#f59e0b' },
    { status: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length,  fill: '#3b82f6' },
    { status: 'Delivered', count: orders.filter(o => o.status === 'delivered').length,  fill: '#22c55e' },
    { status: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length,  fill: '#ef4444' },
    { status: 'Refunded',  count: orders.filter(o => o.status === 'refunded').length,   fill: '#8b5cf6' },
  ];

  return (
    <div style={S.root}>
      {notification && <div style={S.toast}>{notification}</div>}

      <aside style={S.sidebar}>
        <div style={S.logo}>
          <span style={S.logoText}>AGRI<span style={S.logoAccent}>-AI</span></span>
          <span style={S.logoSub}>Admin Panel</span>
        </div>
        <div style={S.sidebarUser}>
          <div style={S.adminBadge}>⚙️</div>
          <div>
            <div style={S.userName}>Administrator</div>
            <div style={S.userRole}>🔧 Full Access</div>
          </div>
        </div>
        <nav style={S.nav}>
          {navItems.map(n => (
            <button key={n.id} style={{ ...S.navBtn, ...(activeTab === n.id ? S.navBtnActive : {}) }}
              onClick={() => setActiveTab(n.id)}>
              <span style={S.navIcon}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <button style={S.logoutBtn} onClick={onLogout}>← Logout</button>
      </aside>

      <main style={S.main}>
        <header style={S.topbar}>
          <div>
            <div style={S.topbarTitle}>{navItems.find(n => n.id === activeTab)?.label}</div>
            <div style={S.topbarSub}>AGRI-AI Admin Dashboard · Full platform control</div>
          </div>
          <div style={S.topbarRight}>
            <div style={S.topbarDate}>{new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}</div>
            <div style={S.adminAvatar}>⚙️</div>
          </div>
        </header>

        <div style={S.content}>

          {activeTab === 'overview' && (
            <>
              <div style={S.statsGrid}>
                {[
                  { label: 'Total Revenue',    value: `₹${(totalRevenue/1000).toFixed(1)}K`, color: '#22c55e', bg: '#f0fdf4' },
                  { label: 'Total Orders',     value: orders.length,                          color: '#3b82f6', bg: '#eff6ff' },
                  { label: 'Active Listings',  value: activeListings,                         color: '#f59e0b', bg: '#fffbeb' },
                  { label: 'Pending Orders',   value: pendingOrders,                          color: '#ef4444', bg: '#fef2f2' },
                ].map((s, i) => (
                  <div key={i} style={{ ...S.statCard, background: s.bg, borderLeft: `4px solid ${s.color}` }}>
                    <div style={S.statLabel}>{s.label}</div>
                    <div style={{ ...S.statValue, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div style={S.chartsRow}>
                <div style={S.chartCard}>
                  <div style={S.chartTitle}>Revenue Over Time</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={revenueByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                      <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                      <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div style={S.chartCard}>
                  <div style={S.chartTitle}>Orders by Status</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={ordersByStatus} barSize={36}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[6,6,0,0]} name="Orders"
                        fill="#3b82f6"
                        label={{ position: 'top', fontSize: 11, fontWeight: 700 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={S.chartCard}>
                <div style={S.chartTitle}>Recent Orders</div>
                <table style={S.table}>
                  <thead>
                    <tr>
                      {['Order ID', 'Buyer', 'Amount', 'Status', 'Date', 'Action'].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 8).map(o => (
                      <tr key={o.id} style={S.tr}>
                        <td style={S.td}>#{o.id}</td>
                        <td style={S.td}>{o.buyer_name}</td>
                        <td style={S.td}>₹{o.grand_total}</td>
                        <td style={S.td}>
                          <span style={{ ...S.statusBadge, background: o.status === 'delivered' ? '#dcfce7' : o.status === 'cancelled' ? '#fee2e2' : '#fef3c7', color: o.status === 'delivered' ? '#16a34a' : o.status === 'cancelled' ? '#dc2626' : '#d97706' }}>
                            {o.status}
                          </span>
                        </td>
                        <td style={S.td}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                        <td style={S.td}>
                          <select style={S.selectSm} value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}>
                            {['pending','confirmed','delivered','cancelled','refunded'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'products' && (
            <>
              <div style={S.sectionHeader}>
                <div style={S.sectionTitle}>All Product Listings ({products.length})</div>
              </div>
              {loading ? (
                <div style={S.centerMsg}>Loading...</div>
              ) : (
                <div style={S.chartCard}>
                  <table style={S.table}>
                    <thead>
                      <tr>{['ID', 'Title', 'Seller', 'Category', 'Price', 'Stock', 'Location', 'Status', 'Action'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id} style={S.tr}>
                          <td style={S.td}>#{p.id}</td>
                          <td style={{ ...S.td, fontWeight: 700 }}>{p.title}</td>
                          <td style={S.td}>{p.seller_name}</td>
                          <td style={S.td}>{p.category}</td>
                          <td style={S.td}>₹{p.price}</td>
                          <td style={S.td}>{p.stock} kg</td>
                          <td style={S.td}>{p.location}</td>
                          <td style={S.td}>
                            <span style={{ ...S.statusBadge, background: p.status === 'active' ? '#dcfce7' : '#fee2e2', color: p.status === 'active' ? '#16a34a' : '#dc2626' }}>{p.status}</span>
                          </td>
                          <td style={S.td}>
                            <button style={S.deleteBtnSm} onClick={() => deleteProduct(p.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'orders' && (
            <>
              <div style={S.sectionTitle}>All Orders ({orders.length})</div>
              <div style={S.chartCard}>
                <table style={S.table}>
                  <thead>
                    <tr>{['Order ID', 'Buyer', 'Email', 'Subtotal', 'Platform Fee', 'Grand Total', 'Status', 'Date', 'Update Status'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id} style={S.tr}>
                        <td style={S.td}>#{o.id}</td>
                        <td style={{ ...S.td, fontWeight: 700 }}>{o.buyer_name}</td>
                        <td style={S.td}>{o.buyer_email}</td>
                        <td style={S.td}>₹{o.total_amount}</td>
                        <td style={S.td}>₹{o.platform_fee}</td>
                        <td style={{ ...S.td, fontWeight: 800, color: '#22c55e' }}>₹{o.grand_total}</td>
                        <td style={S.td}>
                          <span style={{ ...S.statusBadge, background: o.status === 'delivered' ? '#dcfce7' : o.status === 'cancelled' ? '#fee2e2' : o.status === 'refunded' ? '#f5f3ff' : '#fef3c7', color: o.status === 'delivered' ? '#16a34a' : o.status === 'cancelled' ? '#dc2626' : o.status === 'refunded' ? '#7c3aed' : '#d97706' }}>
                            {o.status}
                          </span>
                        </td>
                        <td style={S.td}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                        <td style={S.td}>
                          <select style={S.selectSm} value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}>
                            {['pending','confirmed','delivered','cancelled','refunded'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <div style={S.chartCard}>
              <div style={S.chartTitle}>User Management</div>
              <div style={{ fontSize: 14, color: '#6b7280', marginTop: 8, lineHeight: 1.8 }}>
                User listing requires a dedicated <code>/api/admin/users</code> route which returns all users from the database.
                Add this to your server routes and display here. The admin can:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                {[
                  { icon: '👥', title: 'View All Users',    desc: 'See all registered buyers and sellers with their details.' },
                  { icon: '🔒', title: 'Suspend Accounts',  desc: 'Temporarily block a user account for policy violations.' },
                  { icon: '✅', title: 'Verify Sellers',    desc: 'Manually verify seller Aadhar & PAN documents.' },
                  { icon: '📊', title: 'User Analytics',    desc: 'Track signups, active users, and engagement metrics.' },
                ].map((f, i) => (
                  <div key={i} style={S.featureRow}>
                    <div style={S.featureIcon}>{f.icon}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{f.title}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

const S = {
  root: { display:'flex', height:'100vh', width:'100vw', fontFamily:"'Nunito','Segoe UI',sans-serif", background:'#f8fafc', overflow:'hidden' },
  toast: { position:'fixed', top:20, right:20, background:'#111827', color:'white', borderRadius:12, padding:'12px 20px', fontSize:14, fontWeight:700, zIndex:9999, boxShadow:'0 8px 24px rgba(0,0,0,0.3)' },

  sidebar: { width:240, flexShrink:0, background:'linear-gradient(180deg,#1f2937 0%,#111827 100%)', display:'flex', flexDirection:'column', padding:'0 0 20px', overflowY:'auto', boxShadow:'4px 0 20px rgba(0,0,0,0.2)' },
  logo: { padding:'26px 24px 18px', borderBottom:'1px solid rgba(255,255,255,0.08)' },
  logoText: { color:'white', fontSize:21, fontWeight:800, letterSpacing:1.5, display:'block' },
  logoAccent: { color:'#f59e0b' },
  logoSub: { color:'rgba(255,255,255,0.35)', fontSize:10, textTransform:'uppercase', letterSpacing:1.5, marginTop:2, display:'block' },

  sidebarUser: { display:'flex', alignItems:'center', gap:12, padding:'18px 22px', borderBottom:'1px solid rgba(255,255,255,0.08)' },
  adminBadge: { width:42, height:42, borderRadius:'50%', background:'rgba(245,158,11,0.2)', border:'2px solid rgba(245,158,11,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 },
  userName: { color:'white', fontWeight:700, fontSize:13 },
  userRole: { color:'#fbbf24', fontSize:11, marginTop:2 },

  nav: { flex:1, padding:'14px 12px', display:'flex', flexDirection:'column', gap:3 },
  navBtn: { display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:12, border:'none', background:'transparent', color:'rgba(255,255,255,0.55)', fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left', width:'100%' },
  navBtnActive: { background:'rgba(245,158,11,0.15)', color:'#fbbf24' },
  navIcon: { fontSize:15, width:20, textAlign:'center' },
  logoutBtn: { margin:'0 12px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'10px 14px', color:'rgba(255,255,255,0.5)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },

  main: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  topbar: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 28px', background:'white', borderBottom:'1px solid #e5e7eb', flexShrink:0 },
  topbarTitle: { fontSize:19, fontWeight:800, color:'#111827' },
  topbarSub: { fontSize:12, color:'#9ca3af', marginTop:2 },
  topbarRight: { display:'flex', alignItems:'center', gap:14 },
  topbarDate: { fontSize:12, color:'#6b7280' },
  adminAvatar: { width:36, height:36, borderRadius:'50%', background:'rgba(245,158,11,0.15)', border:'2px solid #fbbf24', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 },

  content: { flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:20 },

  statsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 },
  statCard: { borderRadius:16, padding:'18px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  statLabel: { fontSize:12, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 },
  statValue: { fontSize:26, fontWeight:800 },

  chartsRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 },
  chartCard: { background:'white', borderRadius:18, padding:'22px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', overflowX:'auto' },
  chartTitle: { fontSize:15, fontWeight:800, color:'#111827', marginBottom:14 },

  sectionHeader: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  sectionTitle: { fontSize:18, fontWeight:800, color:'#111827' },
  centerMsg: { textAlign:'center', padding:'60px', color:'#9ca3af' },

  table: { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th: { textAlign:'left', padding:'10px 12px', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.5, borderBottom:'2px solid #f3f4f6', whiteSpace:'nowrap' },
  tr: { borderBottom:'1px solid #f9fafb' },
  td: { padding:'10px 12px', color:'#374151', verticalAlign:'middle', whiteSpace:'nowrap' },
  statusBadge: { display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 },
  selectSm: { border:'1.5px solid #e5e7eb', borderRadius:8, padding:'5px 8px', fontSize:12, color:'#374151', outline:'none', cursor:'pointer', background:'white', fontFamily:'inherit' },
  deleteBtnSm: { background:'#fee2e2', border:'none', borderRadius:8, padding:'5px 12px', fontSize:12, fontWeight:700, color:'#dc2626', cursor:'pointer', fontFamily:'inherit' },

  featureRow: { display:'flex', gap:14, alignItems:'flex-start', background:'#f9fafb', borderRadius:12, padding:'14px 16px' },
  featureIcon: { fontSize:22, width:36, height:36, background:'white', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid #e5e7eb' },
};