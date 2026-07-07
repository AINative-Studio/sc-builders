import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post } from '../api';

const AVATAR_COLORS = [
  'var(--accent)', 'var(--success)', 'var(--primary)',
  'hsl(280 40% 55%)', 'hsl(40 70% 48%)',
];

function Avatar({ letter, bg }) {
  return (
    <div style={{
      width: 34, height: 34, flexShrink: 0, borderRadius: 9,
      background: bg || 'var(--muted)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14,
    }}>{letter}</div>
  );
}

function HistoryView({ messages, loading }) {
  if (loading) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mfg)' }}>Loading...</div>;
  }

  if (messages.length === 0) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mfg)' }}>No messages yet</div>;
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', paddingBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {messages.map((m, i) => {
        const name = m.author_name || m.author_id || 'unknown';
        const letter = name.charAt(0).toUpperCase();
        const time = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
        return (
          <div key={m.id || m._id || i} style={{ display: 'flex', gap: 11 }}>
            <Avatar letter={letter} bg={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14, color: 'var(--fg)' }}>{name}</span>
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)' }}>{time}</span>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--fg)', marginTop: 1 }}>{m.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StateView() {
  const nav = useNavigate();
  return (
    <div style={{ flex: 1, overflow: 'auto', paddingBottom: 20, display: 'flex', flexDirection: 'column', gap: 13 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12.5px', color: 'var(--mfg)' }}>
        <span style={{ color: 'var(--primary)', fontSize: 13 }}>✦</span>
        AI-maintained · <b style={{ color: 'var(--accent)' }}>start a conversation in History tab</b>
      </div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 15px' }}>
        <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', fontWeight: 600, marginBottom: 9 }}>ABOUT THIS CHANNEL</div>
        <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--fg)' }}>
          This is the general chat channel. Switch to the <b>History</b> tab to view and send messages.
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const [tab, setTab] = useState('history');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const slug = 'general';
  const wsRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    get(`/api/channels/${slug}/messages?limit=50`)
      .then(res => setMessages((res.items || res.data || []).reverse()))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const base = import.meta.env.VITE_API_URL || window.location.origin;
    const wsUrl = base.replace(/^http/, 'ws') + `/ws/chat?token=${token}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'message' && msg.data) {
            setMessages(prev => [...prev, msg.data]);
          }
        } catch {}
      };

      ws.onerror = () => {};
      ws.onclose = () => {};

      return () => { ws.close(); };
    } catch {}
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const msg = await post(`/api/channels/${slug}/messages`, { content: input.trim() });
      setMessages(prev => [...prev, msg]);
      setInput('');
    } catch {}
    setSending(false);
  }

  const tabStyle = (t) => ({
    fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 12,
    padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
    background: tab === t ? 'var(--card)' : 'transparent',
    color: tab === t ? 'var(--fg)' : 'var(--mfg)',
  });

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, padding: '18px 0 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18, color: 'var(--fg)' }}>
            <span style={{ color: 'var(--primary)' }}>#</span>{slug}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', background: 'var(--muted)', borderRadius: 9, padding: 3 }}>
            <button onClick={() => setTab('state')} style={tabStyle('state')}>State</button>
            <button onClick={() => setTab('history')} style={tabStyle('history')}>History <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, opacity: .7 }}>{messages.length}</span></button>
          </div>
        </div>
      </div>

      {tab === 'state' ? <StateView /> : <HistoryView messages={messages} loading={loading} />}
      <div ref={bottomRef} />

      <form onSubmit={sendMessage} style={{ flexShrink: 0, padding: '12px 0 18px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 11, padding: '11px 13px',
        }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, fontSize: 14, color: 'var(--fg)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Inter' }}
          />
          <button type="submit" disabled={sending || !input.trim()} style={{
            fontFamily: "'JetBrains Mono'", fontSize: 11, color: input.trim() ? 'var(--primary)' : 'var(--mfg)',
            background: 'none', border: 'none', cursor: input.trim() ? 'pointer' : 'default',
          }}>↵</button>
        </div>
      </form>
    </div>
  );
}
