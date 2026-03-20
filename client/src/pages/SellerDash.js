import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const API    = 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('agri_token');
const authFetch = (url, opts = {}) =>
  fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(opts.headers || {}),
    },
  });

const CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Spices'];

export default function SellerDash({ onLogout }) {
  const [activeTab,    setActiveTab]    = useState('dashboard');
  const [seller,       setSeller]       = useState(null);
  const [products,     setProducts]     = useState([]);
  const [stats,        setStats]        = useState({ totalProducts: 0, activeProducts: 0, totalEarnings: 0, totalOrders: 0 });
  const [monthlyData,  setMonthlyData]  = useState([]);
  const [bankDetails,  setBankDetails]  = useState({ accountName: '', accountNumber: '', ifsc: '', bankName: '', upiId: '' });
  const [bankSaved,    setBankSaved]    = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct,  setEditProduct]  = useState(null);
  const [deleteId,     setDeleteId]     = useState(null);
  const [notification, setNotification] = useState('');
  const [addError,     setAddError]     = useState('');
  const [loading,      setLoading]      = useState(true);
  const [aiSugg,       setAiSugg]       = useState('');
  const [aiLoading,    setAiLoading]    = useState(false);

  const [newProduct, setNewProduct] = useState({
    title: '', description: '', image_url: '', location: '',
    price: '', stock: '', category: 'Vegetables',
  });

  const notify = (msg) => { setNotification(msg); setTimeout(() => setNotification(''), 3000); };

  const fetchMe = useCallback(async () => {
    try {
      const r = await authFetch(`${API}/auth/me`);
      const d = await r.json();
      if (d.success) setSeller(d.user);
      else { notify('Session expired. Please login again.'); setTimeout(() => onLogout(), 2000); }
    } catch { notify('Cannot connect to server.'); }
  }, [onLogout]);

  const fetchProducts = useCallback(async () => {
    try {
      const r = await authFetch(`${API}/products/seller/mine`);
      const d = await r.json();
      if (d.success) setProducts(d.products);
    } catch {}
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const r = await authFetch(`${API}/products/seller/stats`);
      const d = await r.json();
      if (d.success) {
        setStats(d.stats);
        if (d.monthlyEarnings?.length > 0) setMonthlyData(d.monthlyEarnings);
      }
    } catch {}
  }, []);

  const fetchBank = useCallback(async () => {
    try {
      const r = await authFetch(`${API}/seller/bank`);
      const d = await r.json();
      if (d.success && d.bank) setBankDetails(d.bank);
    } catch {}
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchMe(), fetchProducts(), fetchStats(), fetchBank()]);
      setLoading(false);
    };
    init();
  }, [fetchMe, fetchProducts, fetchStats, fetchBank]);

  const handleAddProduct = async () => {
    if (!newProduct.title.trim() || !newProduct.price || !newProduct.location.trim()) {
      setAddError('Title, price and location are required.');
      return;
    }
    try {
      const r = await authFetch(`${API}/products`, {
        method: 'POST',
        body: JSON.stringify({ ...newProduct, price: parseFloat(newProduct.price), stock: parseInt(newProduct.stock) || 0 }),
      });
      const d = await r.json();
      if (d.success) {
        notify('✅ Product listed successfully!');
        setNewProduct({ title: '', description: '', image_url: '', location: '', price: '', stock: '', category: 'Vegetables' });
        setAddError('');
        setShowAddModal(false);
        fetchProducts();
        fetchStats();
      } else {
        setAddError(d.message);
      }
    } catch { setAddError('Server error. Please try again.'); }
  };

  const handleUpdateProduct = async () => {
    if (!editProduct.title.trim() || !editProduct.price || !editProduct.location.trim()) return;
    try {
      const r = await authFetch(`${API}/products/${editProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...editProduct, price: parseFloat(editProduct.price), stock: parseInt(editProduct.stock) || 0 }),
      });
      const d = await r.json();
      if (d.success) {
        notify('✅ Product updated!');
        setEditProduct(null);
        fetchProducts();
      } else notify(`⚠️ ${d.message}`);
    } catch { notify('Server error.'); }
  };

  const handleDeleteProduct = async (id) => {
    try {
      const r = await authFetch(`${API}/products/${id}`, { method: 'DELETE' });
      const d = await r.json();
      if (d.success) { notify('Product deleted.'); fetchProducts(); fetchStats(); }
      else notify(`⚠️ ${d.message}`);
    } catch { notify('Server error.'); }
    setDeleteId(null);
  };

  const toggleStatus = async (product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      const r = await authFetch(`${API}/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...product, status: newStatus }),
      });
      const d = await r.json();
      if (d.success) { fetchProducts(); notify(`Product ${newStatus === 'active' ? 'activated' : 'paused'}.`); }
    } catch {}
  };

  const handleSaveBank = async () => {
    try {
      const r = await authFetch(`${API}/seller/bank`, {
        method: 'POST',
        body: JSON.stringify(bankDetails),
      });
      const d = await r.json();
      if (d.success) { setBankSaved(true); setTimeout(() => setBankSaved(false), 3000); notify('✅ Bank details saved!'); }
      else notify(`⚠️ ${d.message}`);
    } catch {
      localStorage.setItem('agri_bank', JSON.stringify(bankDetails));
      setBankSaved(true);
      setTimeout(() => setBankSaved(false), 3000);
      notify('✅ Saved locally (server offline).');
    }
  };

  const loadAiSuggestions = async () => {
    setAiLoading(true);
    try {
      const r = await authFetch(`${API}/ai/seller-suggestions`);
      const d = await r.json();
      if (d.success) setAiSugg(d.suggestions);
      else setAiSugg('AI service unavailable. Please check your Gemini API key in .env');
    } catch { setAiSugg('Could not connect to AI service.'); }
    finally  { setAiLoading(false); }
  };

  const initials = seller?.name
    ? seller.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'S';

  const navItems = [
    { id: 'dashboard', icon: '▦',  label: 'Dashboard'    },
    { id: 'products',  icon: '🌿', label: 'My Products'  },
    { id: 'bank',      icon: '🏦', label: 'Bank Details' },
    { id: 'ai',        icon: '🤖', label: 'AI Advisor'   },
    { id: 'profile',   icon: '👤', label: 'My Profile'   },
  ];

  const inputStyle = {
    border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '11px 14px',
    fontSize: 14, color: '#111827', outline: 'none', fontFamily: 'inherit',
    width: '100%', boxSizing: 'border-box', background: '#fafafa',
  };

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f0fdf4', fontFamily:'Nunito,sans-serif' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:52, marginBottom:16 }}>🌾</div>
          <div style={{ fontSize:18, color:'#22c55e', fontWeight:700 }}>Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  const growthData = monthlyData.length > 0 ? monthlyData.map(m => ({ month: m.month, earnings: parseFloat(m.earnings) })) : [
    { month: 'No data yet', earnings: 0 }
  ];

  return (
    <div style={S.root}>
      {notification && <div style={S.toast}>{notification}</div>}

      <aside style={S.sidebar}>
        <div style={S.sidebarLogo}>
          <span style={S.logoText}>AGRI<span style={S.logoAccent}>-AI</span></span>
          <span style={S.logoSub}>Seller Portal</span>
        </div>
        <div style={S.sidebarAvatar}>
          <div style={S.avatarCircle}>{initials}</div>
          <div>
            <div style={S.avatarName}>{seller?.name || 'Seller'}</div>
            <div style={S.avatarRole}>✅ Verified Seller</div>
          </div>
        </div>
        <nav style={S.sidebarNav}>
          {navItems.map(item => (
            <button key={item.id}
              style={{ ...S.navItem, ...(activeTab === item.id ? S.navItemActive : {}) }}
              onClick={() => setActiveTab(item.id)}>
              <span style={S.navIcon}>{item.icon}</span>
              {item.label}
              {item.id === 'products' && <span style={S.navBadge}>{products.length}</span>}
            </button>
          ))}
        </nav>
        <div style={S.sidebarFooter}>
          <div style={S.sidebarBadge}>🌱 Eco Certified</div>
          <div style={S.sidebarJoined}>
            Member since {seller?.created_at ? new Date(seller.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
          </div>
          <button style={S.logoutBtn} onClick={onLogout}>← Logout</button>
        </div>
      </aside>

      <main style={S.main}>
        <header style={S.topbar}>
          <div>
            <div style={S.topbarTitle}>{navItems.find(n => n.id === activeTab)?.label}</div>
            <div style={S.topbarSub}>Welcome back, {(seller?.name || 'Seller').split(' ')[0]}! Here's your farm activity.</div>
          </div>
          <div style={S.topbarRight}>
            <div style={S.topbarDate}>{new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}</div>
            <div style={S.topbarAvatar}>{initials}</div>
          </div>
        </header>

        <div style={S.content}>

          {activeTab === 'dashboard' && (
            <>
              <div style={S.statsGrid}>
                {[
                  { label: 'Total Earnings',  value: `₹${(parseFloat(stats.totalEarnings)/1000).toFixed(1)}K`, color: '#22c55e', bg: '#f0fdf4' },
                  { label: 'Total Orders',    value: stats.totalOrders,                                        color: '#3b82f6', bg: '#eff6ff' },
                  { label: 'Active Listings', value: stats.activeProducts,                                     color: '#f59e0b', bg: '#fffbeb' },
                  { label: 'Total Products',  value: stats.totalProducts,                                      color: '#8b5cf6', bg: '#f5f3ff' },
                ].map((s, i) => (
                  <div key={i} style={{ ...S.statCard, background: s.bg, borderLeft: `4px solid ${s.color}` }}>
                    <div style={S.statLabel}>{s.label}</div>
                    <div style={{ ...S.statValue, color: s.color }}>{s.value}</div>
                    <div style={S.statChange}>from your account</div>
                  </div>
                ))}
              </div>

              <div style={S.chartCard}>
                <div style={S.chartTitle}>Monthly Earnings</div>
                <div style={S.chartSub}>Your earnings over time from fulfilled orders</div>
                {growthData.length === 1 && growthData[0].month === 'No data yet' ? (
                  <div style={S.emptyChart}>📊 No order data yet. Your earnings chart will appear once you receive orders.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={210}>
                    <AreaChart data={growthData}>
                      <defs>
                        <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#888' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#888' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                      <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                      <Area type="monotone" dataKey="earnings" stroke="#22c55e" fill="url(#earningsGrad)" strokeWidth={2.5} name="Earnings" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div style={S.chartCard}>
                <div style={S.chartTitle}>Quick Overview</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 14 }}>
                  {[
                    { icon: '🌿', label: 'Active Products',  value: stats.activeProducts  },
                    { icon: '📦', label: 'Total Orders',     value: stats.totalOrders     },
                    { icon: '💰', label: 'Total Earnings',   value: `₹${parseFloat(stats.totalEarnings).toLocaleString()}` },
                  ].map((item, i) => (
                    <div key={i} style={S.quickCard}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>{item.value}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'products' && (
            <>
              <div style={S.productsHeader}>
                <div>
                  <div style={S.sectionTitle}>Your Listed Products</div>
                  <div style={S.sectionSub}>{products.length} products · {stats.activeProducts} active</div>
                </div>
                <button style={S.btnPrimary} onClick={() => { setAddError(''); setShowAddModal(true); }}>+ Add Product</button>
              </div>

              {products.length === 0 ? (
                <div style={S.emptyState}>
                  <div style={{ fontSize: 56, marginBottom: 14 }}>🌾</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 6 }}>No products listed yet</div>
                  <div style={{ fontSize: 14, color: '#9ca3af' }}>Click "+ Add Product" to list your first item.</div>
                </div>
              ) : (
                <div style={S.productsGrid}>
                  {products.map(p => (
                    <div key={p.id} style={S.productCard}>
                      <div style={S.productImgWrap}>
                        {p.image_url
                          ? <img src={p.image_url} alt={p.title} style={S.productImg} onError={e => { e.target.style.display='none'; }} />
                          : <div style={S.productImgPlaceholder}>📦</div>}
                        <span style={{ ...S.productBadge, background: p.status === 'active' ? '#dcfce7' : '#fee2e2', color: p.status === 'active' ? '#16a34a' : '#dc2626' }}>
                          {p.status === 'active' ? '● Live' : '● Paused'}
                        </span>
                      </div>
                      <div style={S.productBody}>
                        <div style={S.productCat}>{p.category}</div>
                        <div style={S.productTitle}>{p.title}</div>
                        <div style={S.productDesc}>{p.description}</div>
                        <div style={S.productMeta}>
                          <span style={S.metaChip}>📍 {p.location}</span>
                          <span style={S.metaPrice}>₹{p.price}<span style={S.metaUnit}>/kg</span></span>
                        </div>
                        <div style={S.metaStock}>Stock: {p.stock} kg</div>
                        <div style={S.productActions}>
                          <button style={{ ...S.btnSmall, background: '#eff6ff', color: '#3b82f6' }} onClick={() => setEditProduct({ ...p })}>Edit</button>
                          <button style={{ ...S.btnSmall, background: p.status === 'active' ? '#fef3c7' : '#dcfce7', color: p.status === 'active' ? '#d97706' : '#16a34a' }} onClick={() => toggleStatus(p)}>
                            {p.status === 'active' ? 'Pause' : 'Activate'}
                          </button>
                          <button style={{ ...S.btnSmall, background: '#fee2e2', color: '#dc2626' }} onClick={() => setDeleteId(p.id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'bank' && (
            <div style={S.formPage}>
              <div style={S.formCard}>
                <div style={S.formCardHeader}>
                  <span style={{ fontSize: 36 }}>🏦</span>
                  <div>
                    <div style={S.formCardTitle}>Bank Account Details</div>
                    <div style={S.formCardSub}>Your payment will be credited here after each fulfilled order.</div>
                  </div>
                </div>
                <div style={S.formGrid}>
                  {[
                    { label: 'Account Holder Name', key: 'accountName',   ph: 'As on bank records'       },
                    { label: 'Account Number',       key: 'accountNumber', ph: 'Enter account number'     },
                    { label: 'IFSC Code',            key: 'ifsc',          ph: 'e.g. SBIN0001234'         },
                    { label: 'Bank Name',            key: 'bankName',      ph: 'e.g. State Bank of India' },
                    { label: 'UPI ID (optional)',    key: 'upiId',         ph: 'e.g. name@upi'            },
                  ].map(f => (
                    <div key={f.key} style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      <label style={S.formLabel}>{f.label}</label>
                      <input type="text" placeholder={f.ph} value={bankDetails[f.key]} style={inputStyle}
                        onChange={e => setBankDetails(p => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div style={S.formNotice}>🔒 Your bank details are encrypted and stored securely on our servers.</div>
                <button style={{ ...S.btnPrimary, width:'100%', padding:14, fontSize:15, justifyContent:'center' }} onClick={handleSaveBank}>
                  {bankSaved ? '✅ Saved Successfully!' : 'Save Bank Details'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div style={S.formPage}>
              <div style={S.formCard}>
                <div style={S.formCardHeader}>
                  <span style={{ fontSize: 36 }}>🤖</span>
                  <div>
                    <div style={S.formCardTitle}>AI Business Advisor</div>
                    <div style={S.formCardSub}>Powered by Gemini — get personalized suggestions to grow your sales and profit.</div>
                  </div>
                </div>
                <button style={{ ...S.btnPrimary, marginBottom: 20 }} onClick={loadAiSuggestions} disabled={aiLoading}>
                  {aiLoading ? '⏳ Analysing your data...' : '✨ Get AI Suggestions'}
                </button>
                {aiSugg ? (
                  <div style={{ fontSize: 14, lineHeight: 1.85, color: '#374151', whiteSpace: 'pre-wrap', background: '#f0fdf4', borderRadius: 14, padding: '18px 20px', border: '1px solid #bbf7d0' }}>
                    {aiSugg}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#9ca3af', padding: '20px 0', textAlign: 'center' }}>
                    Click the button to get AI-powered suggestions based on your products and platform demand data.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div style={S.formPage}>
              <div style={S.formCard}>
                <div style={S.profileHero}>
                  <div style={S.profileAvatarLarge}>{initials}</div>
                  <div>
                    <div style={S.profileName}>{seller?.name || '—'}</div>
                    <div style={{ fontSize: 13, color: '#16a34a', marginBottom: 4 }}>✅ Verified Seller</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>📍 {seller?.location || '—'}</div>
                  </div>
                </div>
                <div style={{ height:1, background:'#f3f4f6', margin:'24px 0' }} />
                <div style={S.profileGrid}>
                  {[
                    { icon: '📧', label: 'Email',         value: seller?.email      || '—' },
                    { icon: '📱', label: 'Phone',          value: seller?.phone      || '—' },
                    { icon: '📍', label: 'Location',       value: seller?.location   || '—' },
                    { icon: '🪪', label: 'Aadhar Number',  value: seller?.aadhar     || '—' },
                    { icon: '📋', label: 'PAN Number',     value: seller?.pan        || '—' },
                    { icon: '📅', label: 'Member Since',   value: seller?.created_at ? new Date(seller.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : '—' },
                  ].map((row, i) => (
                    <div key={i} style={S.profileRow}>
                      <div style={{ fontSize: 20 }}>{row.icon}</div>
                      <div>
                        <div style={{ fontSize:11, color:'#9ca3af', textTransform:'uppercase', letterSpacing:0.5, marginBottom:3 }}>{row.label}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{row.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={S.profileNote}>ℹ️ To update your details, please contact support at support@agri-ai.in</div>
              </div>
            </div>
          )}

        </div>
      </main>

      {showAddModal && (
        <div style={S.overlay} onClick={() => setShowAddModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHeader}><span style={S.modalTitle}>List New Product</span><button style={S.modalClose} onClick={() => setShowAddModal(false)}>✕</button></div>
            <div style={S.modalBody}>
              {[
                { label:'Product Title *',      key:'title',       type:'text',   ph:'e.g. Organic Tomatoes' },
                { label:'Description',          key:'description', type:'text',   ph:'Describe your product...' },
                { label:'Image URL',            key:'image_url',   type:'text',   ph:'https://...' },
                { label:'Selling Location *',   key:'location',    type:'text',   ph:'e.g. Pune, Maharashtra' },
                { label:'Price per kg (₹) *',  key:'price',       type:'number', ph:'0.00' },
                { label:'Stock Available (kg)', key:'stock',       type:'number', ph:'0' },
              ].map(f => (
                <div key={f.key} style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <label style={S.formLabel}>{f.label}</label>
                  <input type={f.type} placeholder={f.ph} value={newProduct[f.key]}
                    onChange={e => setNewProduct(p => ({ ...p, [f.key]: e.target.value }))} style={inputStyle} />
                </div>
              ))}
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={S.formLabel}>Category</label>
                <select value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              {addError && <div style={S.errBox}>{addError}</div>}
              {newProduct.image_url && <img src={newProduct.image_url} alt="preview" style={{ width:'100%', height:130, objectFit:'cover', borderRadius:12 }} onError={e => { e.target.style.display='none'; }} />}
            </div>
            <div style={S.modalFooter}>
              <button style={S.btnGhost} onClick={() => setShowAddModal(false)}>Cancel</button>
              <button style={S.btnPrimary} onClick={handleAddProduct}>List Product</button>
            </div>
          </div>
        </div>
      )}

      {editProduct && (
        <div style={S.overlay} onClick={() => setEditProduct(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHeader}><span style={S.modalTitle}>Edit Product</span><button style={S.modalClose} onClick={() => setEditProduct(null)}>✕</button></div>
            <div style={S.modalBody}>
              {[
                { label:'Product Title *',      key:'title',       type:'text',   ph:'' },
                { label:'Description',          key:'description', type:'text',   ph:'' },
                { label:'Image URL',            key:'image_url',   type:'text',   ph:'' },
                { label:'Selling Location *',   key:'location',    type:'text',   ph:'' },
                { label:'Price per kg (₹) *',  key:'price',       type:'number', ph:'' },
                { label:'Stock Available (kg)', key:'stock',       type:'number', ph:'' },
              ].map(f => (
                <div key={f.key} style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <label style={S.formLabel}>{f.label}</label>
                  <input type={f.type} value={editProduct[f.key] || ''}
                    onChange={e => setEditProduct(p => ({ ...p, [f.key]: e.target.value }))} style={inputStyle} />
                </div>
              ))}
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={S.formLabel}>Category</label>
                <select value={editProduct.category} onChange={e => setEditProduct(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              {editProduct.image_url && <img src={editProduct.image_url} alt="preview" style={{ width:'100%', height:130, objectFit:'cover', borderRadius:12 }} onError={e => { e.target.style.display='none'; }} />}
            </div>
            <div style={S.modalFooter}>
              <button style={S.btnGhost} onClick={() => setEditProduct(null)}>Cancel</button>
              <button style={S.btnPrimary} onClick={handleUpdateProduct}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, maxWidth:380 }}>
            <div style={{ padding:'32px 28px', textAlign:'center' }}>
              <div style={{ fontSize:52, marginBottom:12 }}>🗑️</div>
              <div style={{ fontSize:17, fontWeight:700, color:'#111827', marginBottom:8 }}>Delete this product?</div>
              <div style={{ fontSize:13, color:'#6b7280', marginBottom:28 }}>This will permanently remove it from your listings.</div>
              <div style={{ display:'flex', gap:10 }}>
                <button style={{ ...S.btnGhost, flex:1 }} onClick={() => setDeleteId(null)}>Cancel</button>
                <button style={{ ...S.btnPrimary, flex:1, justifyContent:'center', background:'#dc2626', boxShadow:'none' }} onClick={() => handleDeleteProduct(deleteId)}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const S = {
  root: { display:'flex', height:'100vh', width:'100vw', fontFamily:"'Nunito','Segoe UI',sans-serif", background:'#f8fafc', overflow:'hidden' },
  toast: { position:'fixed', top:20, right:20, background:'#111827', color:'white', borderRadius:12, padding:'12px 20px', fontSize:14, fontWeight:700, zIndex:9999, boxShadow:'0 8px 24px rgba(0,0,0,0.3)' },

  sidebar: { width:240, flexShrink:0, background:'linear-gradient(180deg,#14532d 0%,#166534 60%,#15803d 100%)', display:'flex', flexDirection:'column', padding:'0 0 24px', overflowY:'auto', boxShadow:'4px 0 20px rgba(0,0,0,0.15)' },
  sidebarLogo: { padding:'28px 24px 20px', borderBottom:'1px solid rgba(255,255,255,0.1)' },
  logoText: { color:'white', fontSize:22, fontWeight:800, letterSpacing:1.5, display:'block' },
  logoAccent: { color:'#86efac' },
  logoSub: { color:'rgba(255,255,255,0.45)', fontSize:10, textTransform:'uppercase', letterSpacing:1.5, marginTop:2, display:'block' },

  sidebarAvatar: { display:'flex', alignItems:'center', gap:12, padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.1)' },
  avatarCircle: { width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,0.2)', border:'2px solid rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:15, flexShrink:0 },
  avatarName: { color:'white', fontWeight:700, fontSize:14 },
  avatarRole: { color:'#86efac', fontSize:11, marginTop:2 },

  sidebarNav: { flex:1, padding:'16px 12px', display:'flex', flexDirection:'column', gap:4 },
  navItem: { display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderRadius:12, border:'none', background:'transparent', color:'rgba(255,255,255,0.6)', fontSize:14, fontWeight:600, cursor:'pointer', textAlign:'left', width:'100%' },
  navItemActive: { background:'rgba(255,255,255,0.15)', color:'white', boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.2)' },
  navIcon: { fontSize:15, width:20, textAlign:'center' },
  navBadge: { marginLeft:'auto', background:'rgba(255,255,255,0.2)', borderRadius:20, padding:'2px 8px', fontSize:11, color:'white' },

  sidebarFooter: { padding:'16px 24px', borderTop:'1px solid rgba(255,255,255,0.1)' },
  sidebarBadge: { background:'rgba(134,239,172,0.2)', border:'1px solid rgba(134,239,172,0.4)', borderRadius:20, padding:'5px 12px', color:'#86efac', fontSize:11, fontWeight:700, marginBottom:8, display:'inline-block' },
  sidebarJoined: { color:'rgba(255,255,255,0.35)', fontSize:11, marginBottom:12 },
  logoutBtn: { background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:12, padding:'8px 14px', color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', width:'100%' },

  main: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  topbar: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 32px', background:'white', borderBottom:'1px solid #e5e7eb', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', flexShrink:0 },
  topbarTitle: { fontSize:20, fontWeight:800, color:'#111827' },
  topbarSub: { fontSize:13, color:'#9ca3af', marginTop:2 },
  topbarRight: { display:'flex', alignItems:'center', gap:16 },
  topbarDate: { fontSize:13, color:'#6b7280' },
  topbarAvatar: { width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#22c55e,#15803d)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:13 },

  content: { flex:1, overflowY:'auto', padding:'28px 32px', display:'flex', flexDirection:'column', gap:24 },

  statsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 },
  statCard: { borderRadius:16, padding:'20px 22px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  statLabel: { fontSize:12, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 },
  statValue: { fontSize:28, fontWeight:800, marginBottom:4 },
  statChange: { fontSize:12, color:'#9ca3af' },

  chartCard: { background:'white', borderRadius:18, padding:'22px 24px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' },
  chartTitle: { fontSize:16, fontWeight:800, color:'#111827', marginBottom:2 },
  chartSub: { fontSize:12, color:'#9ca3af', marginBottom:16 },
  emptyChart: { textAlign:'center', padding:'30px', color:'#9ca3af', fontSize:13 },

  quickCard: { background:'#f9fafb', borderRadius:14, padding:'18px', textAlign:'center' },

  productsHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start' },
  sectionTitle: { fontSize:20, fontWeight:800, color:'#111827' },
  sectionSub: { fontSize:13, color:'#9ca3af', marginTop:2 },

  productsGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 },
  productCard: { background:'white', borderRadius:18, boxShadow:'0 2px 10px rgba(0,0,0,0.07)', overflow:'hidden' },
  productImgWrap: { position:'relative', height:155, background:'#f3f4f6' },
  productImg: { width:'100%', height:'100%', objectFit:'cover', display:'block' },
  productImgPlaceholder: { width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:44 },
  productBadge: { position:'absolute', top:10, right:10, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 },
  productBody: { padding:'14px 16px' },
  productCat: { fontSize:10, textTransform:'uppercase', letterSpacing:1, color:'#22c55e', fontWeight:800, marginBottom:3 },
  productTitle: { fontSize:15, fontWeight:800, color:'#111827', marginBottom:4 },
  productDesc: { fontSize:12, color:'#6b7280', marginBottom:10, lineHeight:1.5, minHeight:34 },
  productMeta: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 },
  metaChip: { fontSize:11, color:'#6b7280', background:'#f3f4f6', padding:'3px 8px', borderRadius:8 },
  metaPrice: { fontSize:18, fontWeight:800, color:'#22c55e' },
  metaUnit: { fontSize:12, color:'#9ca3af', fontWeight:400 },
  metaStock: { fontSize:11, color:'#9ca3af', marginBottom:12 },
  productActions: { display:'flex', gap:6 },
  emptyState: { textAlign:'center', padding:'60px 20px', color:'#9ca3af' },

  formPage: { maxWidth:680, margin:'0 auto', width:'100%' },
  formCard: { background:'white', borderRadius:20, padding:'32px', boxShadow:'0 4px 16px rgba(0,0,0,0.08)' },
  formCardHeader: { display:'flex', gap:14, alignItems:'flex-start', marginBottom:28 },
  formCardTitle: { fontSize:20, fontWeight:800, color:'#111827', marginBottom:4 },
  formCardSub: { fontSize:13, color:'#6b7280', lineHeight:1.5 },
  formGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px 20px', marginBottom:20 },
  formLabel: { fontSize:12, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:0.5 },
  formNotice: { background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'12px 16px', fontSize:13, color:'#166534', marginBottom:24 },

  profileHero: { display:'flex', gap:20, alignItems:'center', marginBottom:24 },
  profileAvatarLarge: { width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#22c55e,#15803d)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:28, flexShrink:0 },
  profileName: { fontSize:24, fontWeight:800, color:'#111827', marginBottom:4 },
  profileGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24 },
  profileRow: { display:'flex', gap:12, alignItems:'flex-start', background:'#f9fafb', borderRadius:12, padding:'14px 16px' },
  profileNote: { background:'#fef9ee', border:'1px solid #fde68a', borderRadius:12, padding:'12px 16px', fontSize:13, color:'#92400e' },

  btnPrimary: { background:'linear-gradient(135deg,#22c55e,#15803d)', border:'none', borderRadius:12, padding:'10px 20px', color:'white', fontWeight:700, fontSize:14, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, boxShadow:'0 4px 12px rgba(34,197,94,0.3)', fontFamily:'inherit' },
  btnGhost: { background:'#f3f4f6', border:'none', borderRadius:12, padding:'10px 20px', color:'#374151', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' },
  btnSmall: { border:'none', borderRadius:8, padding:'6px 10px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', flex:1 },

  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)', padding:20 },
  modal: { background:'white', borderRadius:24, width:'100%', maxWidth:520, boxShadow:'0 24px 64px rgba(0,0,0,0.3)', maxHeight:'90vh', overflowY:'auto', display:'flex', flexDirection:'column' },
  modalHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'22px 28px', borderBottom:'1px solid #f3f4f6' },
  modalTitle: { fontSize:18, fontWeight:800, color:'#111827' },
  modalClose: { background:'#f3f4f6', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:14, color:'#374151' },
  modalBody: { padding:'24px 28px', display:'flex', flexDirection:'column', gap:14 },
  modalFooter: { display:'flex', gap:10, justifyContent:'flex-end', padding:'18px 28px', borderTop:'1px solid #f3f4f6' },
  errBox: { background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#dc2626' },
};