import React, { useState, useRef, useEffect } from 'react';

const API      = 'http://localhost:5000/api';
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

const SUGGESTIONS = [
  'Which vegetables are cheapest right now?',
  'When to buy mangoes at best price?',
  'What products are in high demand?',
  'How do I place an order?',
  'Tell me about seasonal availability',
];

export default function AIAssistant({ userRole = 'buyer' }) {
  const [open,        setOpen]        = useState(false);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [hasGreeted,  setHasGreeted]  = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && !hasGreeted) {
      setMessages([{
        role: 'assistant',
        content: `Hi there! 👋 I'm your AGRI-AI Assistant. I can help you with:\n• Market prices & best deals\n• Seasonal crop availability\n• Platform guidance\n• Farming tips\n\nWhat would you like to know?`,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      }]);
      setHasGreeted(true);
    }
  }, [open, hasGreeted]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;

    const userMsg = {
      role: 'user',
      content: msg,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const r = await authFetch(`${API}/ai/chat`, {
        method: 'POST',
        body: JSON.stringify({ message: msg, history }),
      });
      const d = await r.json();
      const reply = d.success ? d.reply : 'Sorry, I could not respond right now. Please try again.';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Cannot connect to AI service. Please check if the server is running.',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setHasGreeted(false);
  };

  return (
    <>
      <button style={{ ...S.fab, ...(open ? S.fabOpen : {}) }} onClick={() => setOpen(!open)}>
        {open ? '✕' : '🤖'}
        {!open && <span style={S.fabLabel}>AI Help</span>}
      </button>

      {open && (
        <div style={S.window}>
          <div style={S.header}>
            <div style={S.headerLeft}>
              <div style={S.headerAvatar}>🌾</div>
              <div>
                <div style={S.headerTitle}>AGRI-AI Assistant</div>
                <div style={S.headerStatus}>● Online · Gemini powered</div>
              </div>
            </div>
            <div style={S.headerActions}>
              <button style={S.headerBtn} onClick={clearChat} title="Clear chat">🗑️</button>
              <button style={S.headerBtn} onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          {messages.length <= 1 && (
            <div style={S.suggestions}>
              <div style={S.suggestionsLabel}>Quick questions:</div>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} style={S.suggBtn} onClick={() => sendMessage(s)}>{s}</button>
              ))}
            </div>
          )}

          <div style={S.messages}>
            {messages.map((m, i) => (
              <div key={i} style={{ ...S.msgRow, ...(m.role === 'user' ? S.msgRowUser : {}) }}>
                {m.role === 'assistant' && <div style={S.msgAvatar}>🌾</div>}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ ...S.bubble, ...(m.role === 'user' ? S.bubbleUser : S.bubbleBot) }}>
                    {m.content}
                  </div>
                  <div style={S.msgTime}>{m.time}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={S.msgRow}>
                <div style={S.msgAvatar}>🌾</div>
                <div style={{ ...S.bubble, ...S.bubbleBot, color: '#9ca3af' }}>
                  <span style={S.typingDot}>●</span>
                  <span style={{ ...S.typingDot, animationDelay: '0.2s' }}>●</span>
                  <span style={{ ...S.typingDot, animationDelay: '0.4s' }}>●</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={S.inputRow}>
            <input
              style={S.input}
              placeholder="Ask about prices, products, tips..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
              disabled={loading}
            />
            <button style={{ ...S.sendBtn, opacity: loading || !input.trim() ? 0.5 : 1 }}
              onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes typingPulse {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 1;   }
        }
      `}</style>
    </>
  );
}

const S = {
  fab: {
    position: 'fixed', bottom: 28, right: 28, zIndex: 500,
    background: 'linear-gradient(135deg,#22c55e,#15803d)',
    border: 'none', borderRadius: 50, padding: '14px 20px',
    color: 'white', fontWeight: 800, fontSize: 20,
    cursor: 'pointer', boxShadow: '0 8px 24px rgba(34,197,94,0.45)',
    display: 'flex', alignItems: 'center', gap: 8,
    fontFamily: "'Nunito','Segoe UI',sans-serif",
    transition: 'transform 0.2s',
  },
  fabOpen: { borderRadius: '50%', padding: 16, fontSize: 18 },
  fabLabel: { fontSize: 13, letterSpacing: 0.3 },

  window: {
    position: 'fixed', bottom: 90, right: 28, zIndex: 499,
    width: 360, maxHeight: 520,
    background: 'white', borderRadius: 22,
    boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
    border: '1px solid #e5e7eb',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    fontFamily: "'Nunito','Segoe UI',sans-serif",
  },

  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'linear-gradient(135deg,#14532d,#15803d)', flexShrink: 0 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 },
  headerTitle: { color: 'white', fontWeight: 800, fontSize: 14 },
  headerStatus: { color: '#86efac', fontSize: 10, marginTop: 2 },
  headerActions: { display: 'flex', gap: 6 },
  headerBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: 'white', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' },

  suggestions: { padding: '10px 12px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 },
  suggestionsLabel: { fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, fontWeight: 700 },
  suggBtn: { display: 'block', width: '100%', textAlign: 'left', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#16a34a', cursor: 'pointer', marginBottom: 4, fontFamily: 'inherit', fontWeight: 600 },

  messages: { flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 },
  msgRow: { display: 'flex', gap: 8, alignItems: 'flex-end' },
  msgRowUser: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 28, height: 28, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 },
  bubble: { maxWidth: '80%', padding: '9px 13px', borderRadius: 14, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  bubbleUser: { background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', borderBottomRightRadius: 4 },
  bubbleBot: { background: '#f3f4f6', color: '#111827', borderBottomLeftRadius: 4 },
  msgTime: { fontSize: 9, color: '#c4c4c4', marginTop: 3, paddingLeft: 2 },

  typingDot: { fontSize: 18, marginRight: 2, display: 'inline-block', animation: 'typingPulse 1s infinite' },

  inputRow: { display: 'flex', gap: 8, padding: '10px 12px', borderTop: '1px solid #f3f4f6', flexShrink: 0 },
  input: { flex: 1, border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '9px 13px', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#111827' },
  sendBtn: { background: 'linear-gradient(135deg,#22c55e,#15803d)', border: 'none', borderRadius: 12, padding: '9px 14px', color: 'white', fontSize: 16, cursor: 'pointer', fontWeight: 800 },
};