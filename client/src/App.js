import React, { useState, useEffect } from 'react';
import Login      from './pages/Login.js';
import BuyerDash  from './pages/BuyerDash.js';
import SellerDash from './pages/SellerDash.js';
import AdminDash  from './pages/AdminDash.js';

export default function App() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token     = localStorage.getItem('agri_token');
    const savedUser = localStorage.getItem('agri_user');

    if (token && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        fetch('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(r => r.json())
          .then(data => {
            if (data.success) setUser(data.user);
            else {
              localStorage.removeItem('agri_token');

              localStorage.removeItem('agri_user');
              setUser(null);
            }
          })
          .catch(() => setUser(parsed))
          .finally(() => setLoading(false));
      } catch {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin  = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem('agri_token');
    localStorage.removeItem('agri_user');
    localStorage.removeItem('agri_seller');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#f0fdf4', fontFamily: 'Nunito, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}></div>
          <div style={{ fontSize: 18, color: '#22c55e', fontWeight: 700 }}>Loading AGRI-AI...</div>
        </div>
      </div>
    );
  }

  if (!user)                  return <Login      onLogin={handleLogin}   />;
  if (user.role === 'seller') return <SellerDash onLogout={handleLogout} />;
  if (user.role === 'admin')  return <AdminDash  onLogout={handleLogout} />;
  return                             <BuyerDash  onLogout={handleLogout} />;
}