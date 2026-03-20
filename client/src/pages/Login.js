import React, { useState, useEffect, useRef } from 'react';

const bgImages = [
  'https://images.unsplash.com/photo-1620200423727-8127f75d7f53?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://plus.unsplash.com/premium_photo-1663945779301-2c51b59c911e?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTE1fHxhZ3JpY3VsdHVyZXxlbnwwfHwwfHx8MA%3D%3D',
  'https://images.unsplash.com/photo-1508175688576-0c076b47b5b5?q=80&w=1548&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1684154739620-ef7b1e078d4d?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?q=80&w=1742&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
];

const FADE_DURATION = 1200;
const HOLD_DURATION = 4000;

const features = [
  { icon: '🚀', title: 'Zero Middlemen',    desc: 'Direct farm-to-buyer transactions.' },
  { icon: '📊', title: 'Live Market Rates', desc: 'Prices updated every hour.' },
  { icon: '🔒', title: 'Verified Sellers',  desc: 'Aadhar & PAN verified farmers.' },
];

const teamMembers = [
  { name: 'Arjun Mehta',    role: 'Founder & CEO',          avatar: 'AM', bio: 'Former IIT Delhi graduate with 10+ years in AgriTech.' },
  { name: 'Priya Sharma',   role: 'Head of Farmer Relations', avatar: 'PS', bio: 'Connects 5,000+ farmers to the digital marketplace.' },
  { name: 'Rahul Verma',    role: 'CTO',                     avatar: 'RV', bio: 'Built the AI matching engine that powers AGRI-AI.' },
  { name: 'Meena Iyer',     role: 'Head of Quality Control', avatar: 'MI', bio: 'Ensures all produce meets FSSAI safety standards.' },
];

const communityGroups = [
  { name: 'Maharashtra Farmers', members: 2340, category: 'Vegetables', icon: '🥦' },
  { name: 'Punjab Grain Growers', members: 1890, category: 'Grains',     icon: '🌾' },
  { name: 'Kerala Spice Network', members: 980,  category: 'Spices',     icon: '🌶️' },
  { name: 'AP Mango Collective',  members: 1230, category: 'Fruits',     icon: '🥭' },
  { name: 'Rajasthan Dairy Hub',  members: 760,  category: 'Dairy',      icon: '🥛' },
  { name: 'Karnataka Organic',    members: 1450, category: 'Organic',    icon: '🌿' },
];

const faqs = [
  { q: 'How do I list my produce?',              a: 'Sign up as a Seller, complete KYC verification with your Aadhar & PAN, then go to your dashboard and click "Add Product" to list your first item.' },
  { q: 'When do I get paid?',                    a: 'Payments are processed within 48 hours of order fulfillment and credited directly to your registered bank account.' },
  { q: 'Is there a commission fee?',             a: 'AGRI-AI charges a 3% platform fee on each successful transaction — far less than traditional middlemen who charge 20–40%.' },
  { q: 'How is produce quality verified?',       a: 'All sellers are Aadhar & PAN verified. Buyers can rate produce after delivery, and accounts with poor ratings are reviewed by our team.' },
  { q: 'Can I buy in bulk for my restaurant?',   a: 'Yes! Buyers can place bulk orders directly. Contact us for special pricing on orders above ₹50,000.' },
];

function Login({ onLogin }) {
  const [navPage, setNavPage]     = useState('home');
  const [view, setView]           = useState('landing');
  const [role, setRole]           = useState('buyer');
  const [animating, setAnimating] = useState(false);
  const [slideDir, setSlideDir]   = useState('right');

  const [bottomIndex, setBottomIndex] = useState(0);
  const [topIndex, setTopIndex]       = useState(1);
  const [topOpacity, setTopOpacity]   = useState(0);
  const indexRef = useRef(0);

  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError,    setLoginError]    = useState('');

  const [buyerName,     setBuyerName]     = useState('');
  const [buyerEmail,    setBuyerEmail]    = useState('');
  const [buyerPassword, setBuyerPassword] = useState('');
  const [buyerLocation, setBuyerLocation] = useState('');
  const [buyerInterest, setBuyerInterest] = useState('');

  const [sellerName,     setSellerName]     = useState('');
  const [sellerEmail,    setSellerEmail]    = useState('');
  const [sellerPassword, setSellerPassword] = useState('');
  const [sellerLocation, setSellerLocation] = useState('');
  const [sellerAadhar,   setSellerAadhar]   = useState('');
  const [sellerPan,      setSellerPan]      = useState('');
  const [sellerFile,     setSellerFile]     = useState(null);
  const [sellerFileName, setSellerFileName] = useState('');
  const fileInputRef = useRef(null);
  const [signupError, setSignupError] = useState('');

  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [contactSent, setContactSent] = useState(false);

  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const cycle = () => {
      const next = (indexRef.current + 1) % bgImages.length;
      setTopIndex(next);
      setTopOpacity(0);
      setTimeout(() => { setTopOpacity(1); }, 50);
      setTimeout(() => {
        setBottomIndex(next);
        setTopOpacity(0);
        indexRef.current = next;
      }, FADE_DURATION + 50);
    };
    const iv = setInterval(cycle, HOLD_DURATION + FADE_DURATION);
    return () => clearInterval(iv);
  }, []);

  const navigate = (nextView, dir = 'left') => {
    if (animating) return;
    setLoginError(''); setSignupError('');
    setAnimating(true); setSlideDir(dir);
    setTimeout(() => { setView(nextView); setAnimating(false); }, 400);
  };

  const [loginLoading,  setLoginLoading]  = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('⚠️ Please fill in both email and password.');
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json();
      if (!data.success) {
        setLoginError(`⚠️ ${data.message}`);
        return;
      }
      localStorage.setItem('agri_token', data.token);
      localStorage.setItem('agri_user',  JSON.stringify(data.user));
      onLogin(data.user);
    } catch {
      setLoginError('⚠️ Cannot connect to server. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async () => {
    if (role === 'buyer') {
      if (!buyerName.trim() || !buyerEmail.trim() || !buyerPassword.trim() || !buyerLocation.trim()) {
        setSignupError('⚠️ Please fill in all required fields.');
        return;
      }
    } else {
      if (!sellerName.trim() || !sellerEmail.trim() || !sellerPassword.trim() || !sellerLocation.trim() || !sellerAadhar.trim() || !sellerPan.trim()) {
        setSignupError('⚠️ Please fill in all required fields.');
        return;
      }
      if (!sellerFile) {
        setSignupError('⚠️ Please upload your income proof.');
        return;
      }
    }

    setSignupLoading(true);
    try {
      const payload = role === 'buyer'
        ? { name: buyerName.trim(), email: buyerEmail.trim(), password: buyerPassword, location: buyerLocation.trim(), role: 'buyer' }
        : { name: sellerName.trim(), email: sellerEmail.trim(), password: sellerPassword, location: sellerLocation.trim(), role: 'seller', aadhar: sellerAadhar.trim(), pan: sellerPan.trim() };

      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        setSignupError(`⚠️ ${data.message}`);
        return;
      }
      localStorage.setItem('agri_token', data.token);
      localStorage.setItem('agri_user',  JSON.stringify(data.user));
      if (role === 'seller') {
        localStorage.setItem('agri_seller', JSON.stringify({
          name: data.user.name, email: data.user.email,
          phone: data.user.phone || '', location: data.user.location || '',
          aadhar: sellerAadhar, pan: sellerPan,
          joined: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
          avatar: data.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        }));
      }
      onLogin(data.user);
    } catch {
      setSignupError('⚠️ Cannot connect to server. Please try again.');
    } finally {
      setSignupLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setSellerFile(file); setSellerFileName(file.name); setSignupError(''); }
  };

  const handleContactSubmit = () => {
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) return;
    setContactSent(true);
    setTimeout(() => setContactSent(false), 4000);
    setContactForm({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  const trackTranslate = role === 'buyer' ? '0%' : '-50%';

  const goHome = () => { setNavPage('home'); setView('landing'); };

  return (
    <div className="portal-root">
      <div className="real-bg bg-bottom" style={{ backgroundImage: `url(${bgImages[bottomIndex]})` }} />
      <div className="real-bg bg-top" style={{ backgroundImage: `url(${bgImages[topIndex]})`, opacity: topOpacity, transition: topOpacity === 1 ? `opacity ${FADE_DURATION}ms ease-in-out` : 'none' }} />
      <div className="bg-overlay" />

      <nav className="top-nav">
        <div className="nav-brand" onClick={goHome} style={{ cursor: 'pointer' }}>
          <span className="brand-text">AGRI<span className="brand-accent">-AI</span></span>
        </div>
        <div className="nav-links">
          <span className={navPage === 'home' ? 'nav-active' : ''} onClick={goHome}>Home</span>
          <span className={navPage === 'about' ? 'nav-active' : ''} onClick={() => setNavPage('about')}>About Us</span>
          <span className={navPage === 'communities' ? 'nav-active' : ''} onClick={() => setNavPage('communities')}>Communities</span>
          <span className={navPage === 'contacts' ? 'nav-active' : ''} onClick={() => setNavPage('contacts')}>Contacts</span>
          <span className={`nav-help ${navPage === 'help' ? 'nav-help-active' : ''}`} onClick={() => setNavPage('help')}>Help</span>
        </div>
      </nav>

      {navPage === 'home' && (
        <div className="main-layout">
          <div className="auth-side">
            <div className="glass-card">
              <div className={`slide-container ${animating ? `exit-${slideDir}` : 'enter'}`} key={view}>

                {view === 'landing' && (
                  <div className="view-panel">
                    <div className="portal-icon">
                      <div className="icon-ring"><span>🌾</span></div>
                    </div>
                    <h1 className="portal-title">Online Farm<br />Portal</h1>
                    <p className="portal-sub">Connect. Trade. Grow.</p>
                    <div className="landing-btns">
                      <button className="btn-agri" onClick={() => navigate('login', 'left')}>Login</button>
                      <button className="btn-agri btn-secondary" onClick={() => navigate('signup', 'left')}>Sign Up</button>
                    </div>
                  </div>
                )}

                {view === 'login' && (
                  <div className="view-panel">
                    <div className="portal-icon small">
                      <div className="icon-ring"><span>🔒</span></div>
                    </div>
                    <h2 className="panel-title">Secure Login</h2>
                    <p className="panel-sub">Welcome back, farmer</p>
                    <div className="input-group">
                      <span className="input-icon">👤</span>
                      <input type="text" className={`agri-input ${loginError && !loginEmail.trim() ? 'input-error' : ''}`} placeholder="Email / Mobile *" value={loginEmail} onChange={e => { setLoginEmail(e.target.value); setLoginError(''); }} />
                    </div>
                    <div className="input-group">
                      <span className="input-icon">🔐</span>
                      <input type="password" className={`agri-input ${loginError && !loginPassword.trim() ? 'input-error' : ''}`} placeholder="Password *" value={loginPassword} onChange={e => { setLoginPassword(e.target.value); setLoginError(''); }} />
                    </div>
                    {loginError && <p className="error-msg">{loginError}</p>}
                    <a className="forgot-link">Forgot Password?</a>
                    <button className="btn-agri full-w mt-20" onClick={handleLogin} disabled={loginLoading}>{loginLoading ? 'Logging in...' : 'Access Dashboard →'}</button>
                    <button className="btn-back" onClick={() => navigate('landing', 'right')}>← Back</button>
                  </div>
                )}

                {view === 'signup' && (
                  <div className="view-panel">
                    <h2 className="panel-title">Join the Network</h2>
                    <div className="role-toggle-wrap">
                      <div className="role-slider" style={{ left: role === 'buyer' ? '4px' : 'calc(50%)' }} />
                      <button className={`role-btn ${role === 'buyer' ? 'active' : ''}`} onClick={() => { setSignupError(''); setRole('buyer'); }}>Buyer</button>
                      <button className={`role-btn ${role === 'seller' ? 'active' : ''}`} onClick={() => { setSignupError(''); setRole('seller'); }}>Seller</button>
                    </div>
                    <div className="role-forms-viewport">
                      <div className="role-forms-track" style={{ transform: `translateX(${trackTranslate})` }}>
                        <div className="role-form-panel">
                          <div className="input-group">
                            <span className="input-icon">👤</span>
                            <input type="text" className={`agri-input ${signupError && role === 'buyer' && !buyerName.trim() ? 'input-error' : ''}`} placeholder="Full Name *" value={buyerName} onChange={e => { setBuyerName(e.target.value); setSignupError(''); }} />
                          </div>
                          <div className="input-group">
                            <span className="input-icon">📧</span>
                            <input type="email" className={`agri-input ${signupError && role === 'buyer' && !buyerEmail.trim() ? 'input-error' : ''}`} placeholder="Email Address *" value={buyerEmail} onChange={e => { setBuyerEmail(e.target.value); setSignupError(''); }} />
                          </div>
                          <div className="input-group">
                            <span className="input-icon">🔐</span>
                            <input type="password" className={`agri-input ${signupError && role === 'buyer' && !buyerPassword.trim() ? 'input-error' : ''}`} placeholder="Password *" value={buyerPassword} onChange={e => { setBuyerPassword(e.target.value); setSignupError(''); }} />
                          </div>
                          <div className="input-group">
                            <span className="input-icon">📍</span>
                            <input type="text" className={`agri-input ${signupError && role === 'buyer' && !buyerLocation.trim() ? 'input-error' : ''}`} placeholder="Location *" value={buyerLocation} onChange={e => { setBuyerLocation(e.target.value); setSignupError(''); }} />
                          </div>
                          <select className="agri-select" value={buyerInterest} onChange={e => setBuyerInterest(e.target.value)}>
                            <option value="">Select Primary Interest</option>
                            <option>Vegetables</option>
                            <option>Fruits</option>
                            <option>Grains</option>
                          </select>
                        </div>
                        <div className="role-form-panel">
                          <div className="input-group">
                            <span className="input-icon">👤</span>
                            <input type="text" className={`agri-input ${signupError && role === 'seller' && !sellerName.trim() ? 'input-error' : ''}`} placeholder="Full Name *" value={sellerName} onChange={e => { setSellerName(e.target.value); setSignupError(''); }} />
                          </div>
                          <div className="input-group">
                            <span className="input-icon">📧</span>
                            <input type="email" className={`agri-input ${signupError && role === 'seller' && !sellerEmail.trim() ? 'input-error' : ''}`} placeholder="Email Address *" value={sellerEmail} onChange={e => { setSellerEmail(e.target.value); setSignupError(''); }} />
                          </div>
                          <div className="input-group">
                            <span className="input-icon">🔐</span>
                            <input type="password" className={`agri-input ${signupError && role === 'seller' && !sellerPassword.trim() ? 'input-error' : ''}`} placeholder="Password *" value={sellerPassword} onChange={e => { setSellerPassword(e.target.value); setSignupError(''); }} />
                          </div>
                          <div className="input-group">
                            <span className="input-icon">📍</span>
                            <input type="text" className={`agri-input ${signupError && role === 'seller' && !sellerLocation.trim() ? 'input-error' : ''}`} placeholder="Location *" value={sellerLocation} onChange={e => { setSellerLocation(e.target.value); setSignupError(''); }} />
                          </div>
                          <div className="id-row">
                            <div className="input-group half">
                              <span className="input-icon small-icon">🪪</span>
                              <input type="text" className={`agri-input ${signupError && role === 'seller' && !sellerAadhar.trim() ? 'input-error' : ''}`} placeholder="Aadhar No. *" value={sellerAadhar} onChange={e => { setSellerAadhar(e.target.value); setSignupError(''); }} />
                            </div>
                            <div className="input-group half">
                              <span className="input-icon small-icon">📋</span>
                              <input type="text" className={`agri-input ${signupError && role === 'seller' && !sellerPan.trim() ? 'input-error' : ''}`} placeholder="PAN No. *" value={sellerPan} onChange={e => { setSellerPan(e.target.value); setSignupError(''); }} />
                            </div>
                          </div>
                          <div className={`file-upload-zone ${sellerFileName ? 'file-selected' : ''} ${signupError && role === 'seller' && !sellerFile ? 'file-error' : ''}`} onClick={() => fileInputRef.current.click()}>
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                            {sellerFileName ? (
                              <div className="file-chosen"><span className="file-check">✅</span><span className="file-chosen-name">{sellerFileName}</span></div>
                            ) : (
                              <div className="file-placeholder">
                                <span className="file-upload-icon">📂</span>
                                <span className="file-upload-text">Upload Income Proof</span>
                                <span className="file-upload-hint">PDF, JPG or PNG · click to browse</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {signupError && <p className="error-msg">{signupError}</p>}
                    <button className="btn-agri full-w mt-10" onClick={handleSignup} disabled={signupLoading}>{signupLoading ? 'Creating Account...' : 'Create Profile'}</button>
                    <button className="btn-back" onClick={() => navigate('landing', 'right')}>← Cancel</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="info-side">
            <div className="info-badge">India's #1 Agri Marketplace</div>
            <h2 className="info-title">Farm Fresh,<br /><span className="info-title-accent">Direct to You</span></h2>
            <p className="info-desc">Bridging the gap between farmers and buyers across India — fair pricing, zero middlemen, straight from the soil to your doorstep.</p>
            <div className="features-list">
              {features.map((f, i) => (
                <div className="feature-item" key={i}>
                  <span className="feature-icon">{f.icon}</span>
                  <div className="feature-text">
                    <span className="feature-title">{f.title}</span>
                    <span className="feature-desc">{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {navPage === 'about' && (
        <div className="page-content">
          <div className="page-hero">
            <div className="page-hero-badge">Our Story</div>
            <h1 className="page-hero-title">We're on a Mission to<br /><span className="page-hero-accent">Empower Every Farmer</span></h1>
            <p className="page-hero-sub">Founded in 2023, AGRI-AI was born out of frustration — watching farmers earn a fraction of what their produce is worth while middlemen pocketed the difference. We built the platform we wished existed.</p>
          </div>

          <div className="about-stats-row">
            {[
              { value: '12,000+', label: 'Farmers Onboarded' },
              { value: '₹4.2Cr',  label: 'Traded Every Day'  },
              { value: '28',      label: 'States Active'      },
              { value: '99%',     label: 'Seller Satisfaction' },
            ].map((s, i) => (
              <div className="about-stat" key={i}>
                <div className="about-stat-value">{s.value}</div>
                <div className="about-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="about-mission">
            <div className="about-mission-card">
              <div className="mission-icon">🎯</div>
              <div className="mission-title">Our Mission</div>
              <div className="mission-body">To cut out every unnecessary layer between farmer and consumer — giving farmers fair prices and buyers fresher produce, powered by AI-driven matching and verified networks.</div>
            </div>
            <div className="about-mission-card">
              <div className="mission-icon">🌍</div>
              <div className="mission-title">Our Vision</div>
              <div className="mission-body">A future where every Indian farmer has direct access to a national market, where income is fair, consistent, and not dependent on who you know or where you are.</div>
            </div>
            <div className="about-mission-card">
              <div className="mission-icon">💡</div>
              <div className="mission-title">Our Values</div>
              <div className="mission-body">Transparency in every transaction. Respect for the farmer's labor. Innovation that serves rural India first. These aren't taglines — they're coded into everything we build.</div>
            </div>
          </div>

          <div className="section-heading">Meet the Team</div>
          <div className="team-grid">
            {teamMembers.map((m, i) => (
              <div className="team-card" key={i}>
                <div className="team-avatar">{m.avatar}</div>
                <div className="team-name">{m.name}</div>
                <div className="team-role">{m.role}</div>
                <div className="team-bio">{m.bio}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {navPage === 'communities' && (
        <div className="page-content">
          <div className="page-hero">
            <div className="page-hero-badge">Farmer Communities</div>
            <h1 className="page-hero-title">Grow Together,<br /><span className="page-hero-accent">Trade Together</span></h1>
            <p className="page-hero-sub">Join regional farmer communities to share knowledge, coordinate bulk sales, and stay updated on market prices in your area.</p>
          </div>

          <div className="comm-grid">
            {communityGroups.map((g, i) => (
              <div className="comm-card" key={i}>
                <div className="comm-icon">{g.icon}</div>
                <div className="comm-name">{g.name}</div>
                <div className="comm-cat">{g.category}</div>
                <div className="comm-members">{g.members.toLocaleString()} members</div>
                <button className="comm-join-btn">Join Community</button>
              </div>
            ))}
          </div>

          <div className="comm-cta">
            <div className="comm-cta-title">Don't see your community?</div>
            <div className="comm-cta-sub">Start a new regional group for your area and invite fellow farmers to connect.</div>
            <button className="btn-agri" style={{ width: 'auto', padding: '12px 32px', margin: '0 auto' }}>Create a Community</button>
          </div>
        </div>
      )}

      {navPage === 'contacts' && (
        <div className="page-content">
          <div className="page-hero">
            <div className="page-hero-badge">Get in Touch</div>
            <h1 className="page-hero-title">We're Here to<br /><span className="page-hero-accent">Help You Grow</span></h1>
            <p className="page-hero-sub">Have a question, feedback, or need support? Our team responds within 24 hours on all working days.</p>
          </div>

          <div className="contact-layout">
            <div className="contact-info-col">
              {[
                { icon: '📍', title: 'Our Office',     body: '14th Floor, AgriTech Tower,\nBandra Kurla Complex,\nMumbai — 400 051' },
                { icon: '📞', title: 'Phone Support',  body: '+91 98765 00000\nMon–Sat, 9am–6pm IST' },
                { icon: '📧', title: 'Email Us',       body: 'support@agri-ai.in\nhello@agri-ai.in' },
                { icon: '💬', title: 'WhatsApp',       body: '+91 98765 11111\nFast responses on WhatsApp' },
              ].map((c, i) => (
                <div className="contact-info-row" key={i}>
                  <div className="contact-info-icon">{c.icon}</div>
                  <div>
                    <div className="contact-info-title">{c.title}</div>
                    <div className="contact-info-body">{c.body}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="contact-form-card">
              <div className="contact-form-title">Send us a Message</div>
              {contactSent && <div className="contact-success">✅ Message sent! We'll get back to you within 24 hours.</div>}
              <div className="contact-form-grid">
                {[
                  { label: 'Your Name *',    key: 'name',    type: 'text',  ph: 'Full name' },
                  { label: 'Email Address *', key: 'email',   type: 'email', ph: 'your@email.com' },
                  { label: 'Phone Number',   key: 'phone',   type: 'tel',   ph: '+91 ...' },
                  { label: 'Subject',        key: 'subject', type: 'text',  ph: 'How can we help?' },
                ].map(f => (
                  <div className="contact-field" key={f.key}>
                    <label className="contact-label">{f.label}</label>
                    <input type={f.type} placeholder={f.ph} className="contact-input" value={contactForm[f.key]} onChange={e => setContactForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div className="contact-field" style={{ marginTop: 12 }}>
                <label className="contact-label">Message *</label>
                <textarea placeholder="Tell us what's on your mind..." className="contact-input contact-textarea" value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} />
              </div>
              <button className="btn-agri" style={{ width: '100%', marginTop: 18, padding: 14, fontSize: 15, justifyContent: 'center' }} onClick={handleContactSubmit}>Send Message</button>
            </div>
          </div>
        </div>
      )}

      {navPage === 'help' && (
        <div className="page-content">
          <div className="page-hero">
            <div className="page-hero-badge">Help Center</div>
            <h1 className="page-hero-title">How Can We<br /><span className="page-hero-accent">Help You?</span></h1>
            <p className="page-hero-sub">Find answers to common questions or reach out to our support team.</p>
          </div>

          <div className="help-cards-row">
            {[
              { icon: '🚀', title: 'Getting Started',   desc: 'New to AGRI-AI? Learn how to create your account, complete KYC, and make your first listing or purchase.' },
              { icon: '💳', title: 'Payments & Billing', desc: 'Understand payment timelines, commission structure, bank setup, and how to raise a dispute.' },
              { icon: '📦', title: 'Orders & Delivery',  desc: 'Track your orders, understand delivery timelines, and learn what to do if something goes wrong.' },
            ].map((h, i) => (
              <div className="help-card" key={i}>
                <div className="help-card-icon">{h.icon}</div>
                <div className="help-card-title">{h.title}</div>
                <div className="help-card-desc">{h.desc}</div>
              </div>
            ))}
          </div>

          <div className="section-heading" style={{ marginTop: 36 }}>Frequently Asked Questions</div>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div className="faq-item" key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="faq-q">
                  <span>{faq.q}</span>
                  <span className="faq-chevron">{openFaq === i ? '▲' : '▼'}</span>
                </div>
                {openFaq === i && <div className="faq-a">{faq.a}</div>}
              </div>
            ))}
          </div>

          <div className="help-contact-row">
            <div className="help-contact-title">Still need help?</div>
            <div className="help-contact-sub">Our support team is available Mon–Sat, 9am to 6pm IST.</div>
            <div className="help-contact-btns">
              <button className="btn-agri" style={{ width: 'auto', padding: '11px 28px' }} onClick={() => setNavPage('contacts')}>Contact Support</button>
              <a className="help-whatsapp-btn" href="https://wa.me/919876500000" target="_blank" rel="noreferrer">WhatsApp Us</a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Login;