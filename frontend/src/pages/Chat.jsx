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
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14,
    }}>{letter}</div>
  );
}

function StateView() {
  const nav = useNavigate();
  return (
    <div style={{ flex: 1, overflow: 'auto', paddingBottom: 20, display: 'flex', flexDirection: 'column', gap: 13 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12.5px', color: 'var(--mfg)' }}>
        <span style={{ color: 'var(--primary)', fontSize: 13 }}>✦</span>
        AI-maintained · updated 2m ago · <b style={{ color: 'var(--accent)' }}>3 items waiting on you</b>
      </div>
      <div style={{ background: 'hsl(158 52% 40% / .09)', border: '1px solid hsl(158 52% 40% / .28)', borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--success)', fontWeight: 600, marginBottom: 6 }}>✓ DECISION REACHED</div>
        <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--fg)' }}>Going with <b>wasm-bindgen</b> over hand-rolled FFI. <b>ana</b> and <b>kai</b> pair Thursday 2pm at Cruzio.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 15px' }}>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--accent)', fontWeight: 600, marginBottom: 9 }}>◦ OPEN QUESTIONS · 2</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, lineHeight: 1.4, color: 'var(--fg)' }}>
            <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--mfg)' }}>—</span><span>Which memory model — shared or copied?</span></div>
            <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--mfg)' }}>—</span><span>Do we need the JS glue in TS?</span></div>
          </div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 15px' }}>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--primary)', fontWeight: 600, marginBottom: 9 }}>→ ACTION ITEMS · 3</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, lineHeight: 1.35, color: 'var(--fg)' }}>
            {[
              { letter: 'A', bg: 'var(--accent)', text: <>share repo access <b style={{ color: 'var(--accent)' }}>· you</b></> },
              { letter: 'K', bg: 'var(--success)', text: 'book pairing room' },
              { letter: 'T', bg: 'var(--primary)', text: 'draft the JS interface' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{
                  width: 16, height: 16, borderRadius: 5,
                  background: item.bg, color: '#fff',
                  fontSize: 9, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Space Grotesk'", flexShrink: 0,
                }}>{item.letter}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 15px' }}>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', fontWeight: 600, marginBottom: 9 }}>⧗ WAITING</div>
          <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--fg)' }}><b>mara</b> is waiting on your repo access to review the build config.</div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 15px' }}>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--accent)', fontWeight: 600, marginBottom: 9 }}>⚑ MISSING EXPERTISE</div>
          <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--fg)' }}>
            No one here has shipped <b>wasm-opt</b> tuning.{' '}
            <button onClick={() => nav('/discovery')} style={{ color: 'var(--primary)', background: 'none', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'Inter' }}>Find someone →</button>
          </div>
        </div>
      </div>
      <button onClick={() => nav('/events/1')} style={{
        textAlign: 'left', background: 'hsl(191 84% 28% / .07)',
        border: '1px solid hsl(191 84% 28% / .2)',
        borderRadius: 12, padding: '12px 15px',
        display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer',
      }}>
        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: '9.5px', fontWeight: 600, background: 'var(--accent)', color: '#fff', padding: '3px 7px', borderRadius: 5, whiteSpace: 'nowrap' }}>NEW OPPORTUNITY</span>
        <span style={{ fontSize: 13, flex: 1, lineHeight: 1.4, color: 'var(--fg)' }}><b>Demo Night Thu</b> lands right after your pairing session — show the WASM module?</span>
        <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 12, color: 'var(--primary)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 8 }}>RSVP</span>
      </button>
    </div>
  );
}

function HistoryView({ messages, loading }) {
  if (loading) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mfg)' }}>Loading messages...</div>;
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', paddingBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {messages.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--mfg)', padding: 30 }}>No messages yet — be the first to say something.</div>
      )}
      {messages.map((m, i) => {
        const name = m.author_name || m.author_id || 'unknown';
        const letter = name.charAt(0).toUpperCase();
        const time = m.created_at
          ? new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          : '';
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

export default function Chat() {
  const [tab, setTab] = useState('state');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const slug = 'general';
  const wsRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    get(`/api/channels/${slug}/messages?limit=50`)
      .then(res => {
        const items = res.items || res.data || [];
        setMessages(items.reverse());
      })
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
      return () => { ws.close(); };
    } catch {}
  }, []);

  useEffect(() => {
    if (tab === 'history') bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, tab]);

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
            <span style={{ color: 'var(--primary)' }}>#</span>wasm-pairing
          </span>
          <span style={{ fontFamily: "'JetBrains Mono'", fontSize: '10.5px', background: 'hsl(158 52% 40% / .16)', color: 'var(--success)', padding: '3px 8px', borderRadius: 20 }}>● active intent</span>
          <div style={{ marginLeft: 'auto', display: 'flex', background: 'var(--muted)', borderRadius: 9, padding: 3 }}>
            <button onClick={() => setTab('state')} style={tabStyle('state')}>State</button>
            <button onClick={() => setTab('history')} style={tabStyle('history')}>History <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, opacity: .7 }}>{messages.length || ''}</span></button>
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
          <span style={{ color: 'var(--mfg)', fontSize: 16 }}>+</span>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Reply, or ask AI to update the state…"
            style={{ flex: 1, fontSize: 14, color: 'var(--fg)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Inter' }}
          />
          <button type="submit" disabled={sending || !input.trim()} style={{
            fontFamily: "'JetBrains Mono'", fontSize: 11,
            color: input.trim() ? 'var(--primary)' : 'var(--mfg)',
            background: 'none', border: 'none', cursor: input.trim() ? 'pointer' : 'default',
          }}>↵</button>
        </div>
      </form>
    </div>
  );
}
