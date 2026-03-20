import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API = 'http://localhost:5000/api';
const token = () => localStorage.getItem('agri_token');
const user  = () => { try { return JSON.parse(localStorage.getItem('agri_user')); } catch { return {}; } };

const authFetch = (url, opts = {}) =>
  fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(opts.headers || {}) } });

const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Spices'];

const demandData = [
  { month: 'Aug', vegetables: 4200, fruits: 3100, grains: 2800 },
  { month: 'Sep', vegetables: 3800, fruits: 4200, grains: 2600 },
  { month: 'Oct', vegetables: 5100, fruits: 3900, grains: 3200 },
  { month: 'Nov', vegetables: 4700, fruits: 2800, grains: 3800 },
  { month: 'Dec', vegetables: 3900, fruits: 2200, grains: 4100 },
  { month: 'Jan', vegetables: 4400, fruits: 3500, grains: 3600 },
  { month: 'Feb', vegetables: 5300, fruits: 4800, grains: 3300 },
];

export default function BuyerDash({ onLogout }) {
  const me = user();
  const [activeTab,    setActiveTab]    = useState('market');
  const [products,     setProducts]     = useState([]);
  const [cart,         setCart]         = useState([]);
  const [billing,      setBilling]      = useState({});
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [cartLoading,  setCartLoading]  = useState(false);
  const [orderDone,    setOrderDone]    = useState(null);
  const [aiInsights,   setAiInsights]   = useState('');
  const [aiLoading,    setAiLoading]    = useState(false);
  const [aiChat,       setAiChat]       = useState([]);
  const [chatInput,    setChatInput]    = useState('');
  const [chatLoading,  setChatLoading]  = useState(false);
  const [search,       setSearch]       = useState('');
  const [category,     setCategory]     = useState('All');
  const [notification, setNotification] = useState('');

  const notify = (msg) => { setNotification(msg); setTimeout(() => setNotification(''), 3000); };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API}/products?`;
      if (search)                url += `search=${encodeURIComponent(search)}&`;
      if (category !== 'All')    url += `category=${encodeURIComponent(category)}`;
      const r = await fetch(url);
      const d = await r.json();
      if (d.success) setProducts(d.products);
    } catch { notify('Failed to load products.'); }
    finally  { setLoading(false); }
  }, [search, category]);

  const fetchCart = useCallback(async () => {
    try {
      const r = await authFetch(`${API}/cart`);
      const d = await r.json();
      if (d.success) { setCart(d.cart); setBilling(d.billing); }
    } catch {}
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const r = await authFetch(`${API}/orders`);
      const d = await r.json();
      if (d.success) setOrders(d.orders);
    } catch {}
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId) => {
    setCartLoading(true);
    try {
      const r = await authFetch(`${API}/cart`, { method: 'POST', body: JSON.stringify({ product_id: productId, quantity: 1 }) });
      const d = await r.json();
      if (d.success) { notify('✅ Added to cart!'); fetchCart(); }
      else notify(`⚠️ ${d.message}`);
    } catch { notify('Failed to add to cart.'); }
    finally  { setCartLoading(false); }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await authFetch(`${API}/cart/${cartItemId}`, { method: 'DELETE' });
      fetchCart();
      notify('Removed from cart.');
    } catch { notify('Failed to remove item.'); }
  };

  const updateQty = async (cartItemId, qty) => {
    if (qty < 1) return;
    try {
      await authFetch(`${API}/cart/${cartItemId}`, { method: 'PUT', body: JSON.stringify({ quantity: qty }) });
      fetchCart();
    } catch {}
  };

  const placeOrder = async () => {
    try {
      const r = await authFetch(`${API}/orders`, { method: 'POST' });
      const d = await r.json();
      if (d.success) {
        setOrderDone(d.order);
        setCart([]); setBilling({});
        fetchOrders();
        setActiveTab('orders');
        notify('🎉 Order placed successfully!');
      } else notify(`⚠️ ${d.message}`);
    } catch { notify('Failed to place order.'); }
  };

  const loadAiInsights = async () => {
    setAiLoading(true);
    try {
      const r = await authFetch(`${API}/ai/buyer-insights`);
      const d = await r.json();
      if (d.success) setAiInsights(d.insights);
      else setAiInsights('AI service unavailable. Please try again later.');
    } catch { setAiInsights('Could not connect to AI service.'); }
    finally  { setAiLoading(false); }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', content: chatInput.trim() };
    setAiChat(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const r = await authFetch(`${API}/ai/chat`, { method: 'POST', body: JSON.stringify({ message: userMsg.content, history: aiChat }) });
      const d = await r.json();
      if (d.success) setAiChat(prev => [...prev, { role: 'assistant', content: d.reply }]);
    } catch { setAiChat(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not respond right now.' }]); }
    finally  { setChatLoading(false); }
  };

  const navItems = [
    { id: 'market',   icon: '🛒', label: 'Marketplace' },
    { id: 'cart',     icon: '🧺', label: `Cart${cart.length ? ` (${cart.length})` : ''}` },
    { id: 'orders',   icon: '📦', label: 'My Orders' },
    { id: 'insights', icon: '📊', label: 'Market Insights' },
    { id: 'ai',       icon: '🤖', label: 'AI Assistant' },
    { id: 'profile',  icon: '👤', label: 'Profile' },
  ];

  const initials = me.name ? me.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'B';

  return (
    <div style={S.root}>
      {notification && <div style={S.toast}>{notification}</div>}

      <aside style={S.sidebar}>
        <div style={S.logo}>
          <span style={S.logoText}>AGRI<span style={S.logoAccent}>-AI</span></span>
          <span style={S.logoSub}>Buyer Portal</span>
        </div>
        <div style={S.sidebarUser}>
          <div style={S.userAvatar}>{initials}</div>
          <div>
            <div style={S.userName}>{me.name || 'Buyer'}</div>
            <div style={S.userRole}>🛒 Buyer Account</div>
          </div>
        </div>
        <nav style={S.nav}>
          {navItems.map(n => (
            <button key={n.id} style={{ ...S.navBtn, ...(activeTab === n.id ? S.navBtnActive : {}) }}
              onClick={() => { setActiveTab(n.id); if (n.id === 'orders') fetchOrders(); }}>
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
            <div style={S.topbarSub}>Welcome back, {(me.name || 'Buyer').split(' ')[0]}!</div>
          </div>
          <div style={S.topbarRight}>
            <div style={S.topbarDate}>{new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}</div>
            <div style={S.userAvatarSm}>{initials}</div>
          </div>
        </header>

        <div style={S.content}>

          {activeTab === 'market' && (
            <>
              <div style={S.searchBar}>
                <input style={S.searchInput} placeholder="🔍 Search products, categories, locations..." value={search}
                  onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchProducts()} />
                <button style={S.searchBtn} onClick={fetchProducts}>Search</button>
              </div>
              <div style={S.catRow}>
                {CATEGORIES.map(c => (
                  <button key={c} style={{ ...S.catBtn, ...(category === c ? S.catBtnActive : {}) }}
                    onClick={() => setCategory(c)}>{c}</button>
                ))}
              </div>
              {loading ? (
                <div style={S.centerMsg}>Loading products...</div>
              ) : products.length === 0 ? (
                <div style={S.centerMsg}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🌾</div>
                  <div>No products found. Try a different search.</div>
                </div>
              ) : (
                <div style={S.productsGrid}>
                  {products.map(p => (
                    <div key={p.id} style={S.productCard}>
                      <div style={S.productImgWrap}>
                        {p.image_url ? <img src={p.image_url} alt={p.title} style={S.productImg} onError={e => { e.target.style.display = 'none'; }} /> : <div style={S.productImgPlaceholder}>🥬</div>}
                        <span style={S.productCatBadge}>{p.category}</span>
                      </div>
                      <div style={S.productBody}>
                        <div style={S.productTitle}>{p.title}</div>
                        <div style={S.productDesc}>{p.description}</div>
                        <div style={S.productMeta}>
                          <span style={S.metaChip}>📍 {p.location || p.seller_location}</span>
                          <span style={S.productPrice}>₹{p.price}<span style={S.priceUnit}>/kg</span></span>
                        </div>
                        <div style={S.productSeller}>By {p.seller_name} · Stock: {p.stock} kg</div>
                        <button style={{ ...S.addCartBtn, opacity: p.stock === 0 ? 0.5 : 1 }}
                          onClick={() => p.stock > 0 && addToCart(p.id)} disabled={p.stock === 0 || cartLoading}>
                          {p.stock === 0 ? 'Out of Stock' : '+ Add to Cart'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'cart' && (
            <>
              {cart.length === 0 ? (
                <div style={S.centerMsg}>
                  <div style={{ fontSize: 52, marginBottom: 14 }}>🧺</div>
                  <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Your cart is empty</div>
                  <div style={{ fontSize: 14, color: '#9ca3af' }}>Go to Marketplace to add products.</div>
                </div>
              ) : (
                <div style={S.cartLayout}>
                  <div style={S.cartItems}>
                    <div style={S.sectionTitle}>Cart Items ({cart.length})</div>
                    {cart.map(item => (
                      <div key={item.id} style={S.cartItem}>
                        <div style={S.cartItemImg}>
                          {item.image_url ? <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28 }}>🥬</span>}
                        </div>
                        <div style={S.cartItemInfo}>
                          <div style={S.cartItemTitle}>{item.title}</div>
                          <div style={S.cartItemMeta}>📍 {item.location} · By {item.seller_name}</div>
                          <div style={S.cartItemPrice}>₹{item.price}/kg</div>
                        </div>
                        <div style={S.cartItemQty}>
                          <button style={S.qtyBtn} onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                          <span style={S.qtyNum}>{item.quantity}</span>
                          <button style={S.qtyBtn} onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                        </div>
                        <div style={S.cartItemTotal}>₹{(item.price * item.quantity).toFixed(2)}</div>
                        <button style={S.removeBtn} onClick={() => removeFromCart(item.id)}>✕</button>
                      </div>
                    ))}
                  </div>

                  <div style={S.billingCard}>
                    <div style={S.billingTitle}>Order Summary</div>
                    <div style={S.billingRow}><span>Subtotal</span><span>₹{billing.subtotal?.toFixed(2)}</span></div>
                    <div style={S.billingRow}><span>Platform Fee (3%)</span><span>₹{billing.platform_fee?.toFixed(2)}</span></div>
                    <div style={S.billingRow}><span>Processing Fee</span><span>₹{billing.processing_fee?.toFixed(2)}</span></div>
                    <div style={{ height: 1, background: '#e5e7eb', margin: '12px 0' }} />
                    <div style={{ ...S.billingRow, fontWeight: 800, fontSize: 18, color: '#111827' }}>
                      <span>Grand Total</span><span style={{ color: '#22c55e' }}>₹{billing.grand_total?.toFixed(2)}</span>
                    </div>
                    <button style={{ ...S.btnGreen, width: '100%', marginTop: 20, padding: 14, fontSize: 15, justifyContent: 'center' }} onClick={placeOrder}>
                      Place Order →
                    </button>
                    <div style={S.billingNote}>🔒 Secure checkout · 3% platform fee supports AGRI-AI</div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'orders' && (
            <>
              <div style={S.sectionTitle}>Your Orders</div>
              {orders.length === 0 ? (
                <div style={S.centerMsg}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                  <div>No orders yet. Start shopping!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {orders.map(order => (
                    <div key={order.id} style={S.orderCard}>
                      <div style={S.orderHeader}>
                        <div>
                          <div style={S.orderTitle}>Order #{order.id}</div>
                          <div style={S.orderDate}>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ ...S.orderStatus, background: order.status === 'delivered' ? '#dcfce7' : order.status === 'cancelled' ? '#fee2e2' : '#fef3c7', color: order.status === 'delivered' ? '#16a34a' : order.status === 'cancelled' ? '#dc2626' : '#d97706' }}>{order.status}</div>
                          <div style={S.orderTotal}>₹{order.grand_total}</div>
                        </div>
                      </div>
                      {order.items && (
                        <div style={S.orderItems}>
                          {order.items.map((item, i) => (
                            <div key={i} style={S.orderItem}>{item.title} × {item.quantity} — ₹{(item.price * item.quantity).toFixed(2)}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'insights' && (
            <>
              <div style={S.chartsRow}>
                <div style={S.chartCard}>
                  <div style={S.chartTitle}>Category Demand Trends</div>
                  <div style={S.chartSub}>Monthly demand by category (units sold)</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={demandData}>
                      <defs>
                        <linearGradient id="vegGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="fruitGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="vegetables" stroke="#22c55e" fill="url(#vegGrad)"   strokeWidth={2} name="Vegetables" />
                      <Area type="monotone" dataKey="fruits"     stroke="#f59e0b" fill="url(#fruitGrad)" strokeWidth={2} name="Fruits" />
                      <Line type="monotone" dataKey="grains"     stroke="#3b82f6" strokeWidth={2} dot={false} name="Grains" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div style={S.chartCard}>
                  <div style={S.chartTitle}>Best Buying Months</div>
                  <div style={S.chartSub}>When prices are lowest by category</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                    {[
                      { cat: 'Vegetables', best: 'October–November', icon: '🥦', color: '#22c55e', tip: 'Winter harvest season — highest supply, lowest prices.' },
                      { cat: 'Fruits',     best: 'March–April',      icon: '🥭', color: '#f59e0b', tip: 'Summer fruit season peaks — mangoes, melons in abundance.' },
                      { cat: 'Grains',     best: 'December–January', icon: '🌾', color: '#3b82f6', tip: 'Post-rabi harvest — wheat and rice at lowest prices.' },
                      { cat: 'Spices',     best: 'February–March',   icon: '🌶️', color: '#ef4444', tip: 'Post-harvest season for most spice varieties.' },
                    ].map((r, i) => (
                      <div key={i} style={S.insightRow}>
                        <span style={{ fontSize: 22 }}>{r.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{r.cat} — <span style={{ color: r.color }}>{r.best}</span></div>
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{r.tip}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={S.aiInsightCard}>
                <div style={S.aiInsightHeader}>
                  <div>
                    <div style={S.chartTitle}>🤖 AI Market Analysis</div>
                    <div style={S.chartSub}>Real-time insights powered by Gemini AI</div>
                  </div>
                  <button style={S.btnGreen} onClick={loadAiInsights} disabled={aiLoading}>
                    {aiLoading ? 'Analysing...' : '✨ Get AI Insights'}
                  </button>
                </div>
                {aiInsights ? (
                  <div style={S.aiInsightText}>{aiInsights}</div>
                ) : (
                  <div style={S.aiInsightEmpty}>Click "Get AI Insights" to receive personalized market analysis based on current demand data.</div>
                )}
              </div>
            </>
          )}

          {activeTab === 'ai' && (
            <div style={S.chatContainer}>
              <div style={S.chatHeader}>
                <div style={S.chatAvatarLarge}>🌾</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>AGRI-AI Assistant</div>
                  <div style={{ fontSize: 13, color: '#22c55e' }}>Powered by Gemini · Ask me anything about farming & markets</div>
                </div>
              </div>
              <div style={S.chatMessages}>
                {aiChat.length === 0 && (
                  <div style={S.chatWelcome}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>👋</div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Hi {(me.name || 'there').split(' ')[0]}!</div>
                    <div style={{ color: '#6b7280', fontSize: 13 }}>Ask me about prices, seasonal availability, best deals, or anything about the marketplace.</div>
                    <div style={S.chatSuggestions}>
                      {['Which vegetables are cheapest this month?', 'When to buy mangoes at best price?', 'What is in high demand now?'].map((s, i) => (
                        <button key={i} style={S.suggBtn} onClick={() => { setChatInput(s); }}>{s}</button>
                      ))}
                    </div>
                  </div>
                )}
                {aiChat.map((msg, i) => (
                  <div key={i} style={{ ...S.chatMsg, ...(msg.role === 'user' ? S.chatMsgUser : S.chatMsgBot) }}>
                    {msg.content}
                  </div>
                ))}
                {chatLoading && <div style={{ ...S.chatMsg, ...S.chatMsgBot, color: '#9ca3af' }}>Thinking...</div>}
              </div>
              <div style={S.chatInputRow}>
                <input style={S.chatInput} placeholder="Ask about prices, products, market trends..." value={chatInput}
                  onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} />
                <button style={S.chatSendBtn} onClick={sendChat} disabled={chatLoading}>Send</button>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div style={S.profileCard}>
              <div style={S.profileHero}>
                <div style={S.profileAvatarLg}>{initials}</div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>{me.name}</div>
                  <div style={{ fontSize: 13, color: '#22c55e', marginTop: 4 }}>🛒 Verified Buyer</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>📍 {me.location || '—'}</div>
                </div>
              </div>
              <div style={{ height: 1, background: '#f3f4f6', margin: '24px 0' }} />
              <div style={S.profileGrid}>
                {[
                  { icon: '📧', label: 'Email',       value: me.email    || '—' },
                  { icon: '📱', label: 'Phone',        value: me.phone    || '—' },
                  { icon: '📍', label: 'Location',     value: me.location || '—' },
                  { icon: '📅', label: 'Member Since', value: me.created_at ? new Date(me.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—' },
                ].map((r, i) => (
                  <div key={i} style={S.profileRow}>
                    <div style={{ fontSize: 22 }}>{r.icon}</div>
                    <div>
                      <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{r.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{r.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#1d4ed8', marginTop: 8 }}>
                📦 Total Orders: {orders.length} &nbsp;|&nbsp; 🛒 Items in Cart: {cart.length}
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

  sidebar: { width:240, flexShrink:0, background:'linear-gradient(180deg,#1e3a5f 0%,#1e40af 60%,#2563eb 100%)', display:'flex', flexDirection:'column', padding:'0 0 20px', overflowY:'auto', boxShadow:'4px 0 20px rgba(0,0,0,0.15)' },
  logo: { padding:'26px 24px 18px', borderBottom:'1px solid rgba(255,255,255,0.1)' },
  logoText: { color:'white', fontSize:21, fontWeight:800, letterSpacing:1.5, display:'block' },
  logoAccent: { color:'#93c5fd' },
  logoSub: { color:'rgba(255,255,255,0.45)', fontSize:10, textTransform:'uppercase', letterSpacing:1.5, marginTop:2, display:'block' },

  sidebarUser: { display:'flex', alignItems:'center', gap:12, padding:'18px 22px', borderBottom:'1px solid rgba(255,255,255,0.1)' },
  userAvatar: { width:42, height:42, borderRadius:'50%', background:'rgba(255,255,255,0.2)', border:'2px solid rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:14, flexShrink:0 },
  userName: { color:'white', fontWeight:700, fontSize:13 },
  userRole: { color:'#93c5fd', fontSize:11, marginTop:2 },

  nav: { flex:1, padding:'14px 12px', display:'flex', flexDirection:'column', gap:3 },
  navBtn: { display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:12, border:'none', background:'transparent', color:'rgba(255,255,255,0.6)', fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left', width:'100%' },
  navBtnActive: { background:'rgba(255,255,255,0.15)', color:'white' },
  navIcon: { fontSize:15, width:20, textAlign:'center' },
  logoutBtn: { margin:'0 12px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:12, padding:'10px 14px', color:'rgba(255,255,255,0.6)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },

  main: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  topbar: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 28px', background:'white', borderBottom:'1px solid #e5e7eb', flexShrink:0 },
  topbarTitle: { fontSize:19, fontWeight:800, color:'#111827' },
  topbarSub: { fontSize:12, color:'#9ca3af', marginTop:2 },
  topbarRight: { display:'flex', alignItems:'center', gap:14 },
  topbarDate: { fontSize:12, color:'#6b7280' },
  userAvatarSm: { width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:12 },

  content: { flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:20 },

  searchBar: { display:'flex', gap:10 },
  searchInput: { flex:1, border:'1.5px solid #e5e7eb', borderRadius:12, padding:'11px 16px', fontSize:14, outline:'none', fontFamily:'inherit', color:'#111827', background:'white' },
  searchBtn: { background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', border:'none', borderRadius:12, padding:'11px 22px', color:'white', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' },

  catRow: { display:'flex', gap:8, flexWrap:'wrap' },
  catBtn: { border:'1.5px solid #e5e7eb', borderRadius:20, padding:'6px 16px', fontSize:12, fontWeight:700, cursor:'pointer', background:'white', color:'#374151', fontFamily:'inherit' },
  catBtnActive: { background:'#3b82f6', borderColor:'#3b82f6', color:'white' },

  centerMsg: { textAlign:'center', padding:'60px 20px', color:'#9ca3af', fontSize:15 },

  productsGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 },
  productCard: { background:'white', borderRadius:16, boxShadow:'0 2px 10px rgba(0,0,0,0.07)', overflow:'hidden' },
  productImgWrap: { position:'relative', height:150, background:'#f3f4f6' },
  productImg: { width:'100%', height:'100%', objectFit:'cover' },
  productImgPlaceholder: { width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:44 },
  productCatBadge: { position:'absolute', top:8, left:8, background:'#3b82f6', color:'white', fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20 },
  productBody: { padding:'14px' },
  productTitle: { fontSize:14, fontWeight:800, color:'#111827', marginBottom:4 },
  productDesc: { fontSize:12, color:'#6b7280', marginBottom:10, lineHeight:1.5, minHeight:32 },
  productMeta: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 },
  metaChip: { fontSize:11, color:'#6b7280', background:'#f3f4f6', padding:'3px 8px', borderRadius:8 },
  productPrice: { fontSize:17, fontWeight:800, color:'#22c55e' },
  priceUnit: { fontSize:11, color:'#9ca3af', fontWeight:400 },
  productSeller: { fontSize:11, color:'#9ca3af', marginBottom:12 },
  addCartBtn: { width:'100%', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', border:'none', borderRadius:10, padding:'9px', color:'white', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' },

  cartLayout: { display:'grid', gridTemplateColumns:'1fr 340px', gap:20, alignItems:'start' },
  cartItems: { background:'white', borderRadius:16, padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' },
  sectionTitle: { fontSize:18, fontWeight:800, color:'#111827', marginBottom:16 },
  cartItem: { display:'flex', alignItems:'center', gap:14, padding:'14px 0', borderBottom:'1px solid #f3f4f6' },
  cartItemImg: { width:56, height:56, borderRadius:10, background:'#f3f4f6', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' },
  cartItemInfo: { flex:1 },
  cartItemTitle: { fontSize:14, fontWeight:700, color:'#111827' },
  cartItemMeta: { fontSize:11, color:'#9ca3af', marginTop:2 },
  cartItemPrice: { fontSize:13, fontWeight:700, color:'#22c55e', marginTop:4 },
  cartItemQty: { display:'flex', alignItems:'center', gap:8 },
  qtyBtn: { width:28, height:28, borderRadius:8, border:'1.5px solid #e5e7eb', background:'white', cursor:'pointer', fontWeight:700, fontSize:14 },
  qtyNum: { fontSize:14, fontWeight:700, minWidth:24, textAlign:'center' },
  cartItemTotal: { fontSize:15, fontWeight:800, color:'#111827', minWidth:70, textAlign:'right' },
  removeBtn: { background:'#fee2e2', border:'none', borderRadius:8, width:28, height:28, cursor:'pointer', color:'#dc2626', fontWeight:700, fontSize:12 },

  billingCard: { background:'white', borderRadius:16, padding:'22px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' },
  billingTitle: { fontSize:17, fontWeight:800, color:'#111827', marginBottom:18 },
  billingRow: { display:'flex', justifyContent:'space-between', fontSize:14, color:'#374151', marginBottom:10 },
  billingNote: { fontSize:11, color:'#9ca3af', textAlign:'center', marginTop:10 },

  orderCard: { background:'white', borderRadius:14, padding:'18px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  orderHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 },
  orderTitle: { fontSize:15, fontWeight:800, color:'#111827' },
  orderDate: { fontSize:12, color:'#9ca3af', marginTop:3 },
  orderStatus: { display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 },
  orderTotal: { fontSize:16, fontWeight:800, color:'#22c55e', marginTop:6 },
  orderItems: { display:'flex', flexDirection:'column', gap:4 },
  orderItem: { fontSize:12, color:'#6b7280' },

  chartsRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 },
  chartCard: { background:'white', borderRadius:18, padding:'22px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' },
  chartTitle: { fontSize:15, fontWeight:800, color:'#111827', marginBottom:2 },
  chartSub: { fontSize:12, color:'#9ca3af', marginBottom:14 },
  insightRow: { display:'flex', gap:12, alignItems:'flex-start', background:'#f9fafb', borderRadius:10, padding:'12px' },

  aiInsightCard: { background:'white', borderRadius:18, padding:'22px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' },
  aiInsightHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  aiInsightText: { fontSize:13.5, lineHeight:1.8, color:'#374151', whiteSpace:'pre-wrap' },
  aiInsightEmpty: { fontSize:13, color:'#9ca3af', padding:'20px 0', textAlign:'center' },

  chatContainer: { background:'white', borderRadius:18, padding:'22px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column', height:'calc(100vh - 180px)' },
  chatHeader: { display:'flex', gap:14, alignItems:'center', paddingBottom:16, borderBottom:'1px solid #f3f4f6', marginBottom:16 },
  chatAvatarLarge: { width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#22c55e,#15803d)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 },
  chatMessages: { flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:12, paddingBottom:12 },
  chatWelcome: { textAlign:'center', padding:'20px', color:'#374151' },
  chatSuggestions: { display:'flex', flexDirection:'column', gap:8, marginTop:14 },
  suggBtn: { background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'8px 14px', fontSize:12, color:'#16a34a', cursor:'pointer', fontFamily:'inherit', textAlign:'left' },
  chatMsg: { maxWidth:'75%', padding:'11px 15px', borderRadius:16, fontSize:13.5, lineHeight:1.6, whiteSpace:'pre-wrap' },
  chatMsgUser: { background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', color:'white', borderBottomRightRadius:4, alignSelf:'flex-end' },
  chatMsgBot: { background:'#f3f4f6', color:'#111827', borderBottomLeftRadius:4, alignSelf:'flex-start' },
  chatInputRow: { display:'flex', gap:10, paddingTop:14, borderTop:'1px solid #f3f4f6' },
  chatInput: { flex:1, border:'1.5px solid #e5e7eb', borderRadius:12, padding:'11px 14px', fontSize:14, outline:'none', fontFamily:'inherit' },
  chatSendBtn: { background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', border:'none', borderRadius:12, padding:'11px 22px', color:'white', fontWeight:700, cursor:'pointer', fontFamily:'inherit' },

  profileCard: { background:'white', borderRadius:20, padding:'28px', boxShadow:'0 4px 16px rgba(0,0,0,0.07)', maxWidth:640 },
  profileHero: { display:'flex', gap:18, alignItems:'center', marginBottom:8 },
  profileAvatarLg: { width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:24, flexShrink:0 },
  profileGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 },
  profileRow: { display:'flex', gap:12, alignItems:'flex-start', background:'#f9fafb', borderRadius:12, padding:'13px 15px' },

  btnGreen: { background:'linear-gradient(135deg,#22c55e,#15803d)', border:'none', borderRadius:12, padding:'10px 20px', color:'white', fontWeight:700, fontSize:14, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, fontFamily:'inherit' },
};