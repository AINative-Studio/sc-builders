import { useNavigate } from 'react-router-dom';

export default function NotificationSheet({ onClose }) {
  const nav = useNavigate();
  const go = (path) => { onClose(); nav(path); };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,25,.4)', zIndex: 40 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 360,
        background: 'var(--card)', borderLeft: '1px solid var(--border)',
        zIndex: 41, display: 'flex', flexDirection: 'column',
        boxShadow: '-16px 0 40px -20px rgba(0,0,0,.4)',
        animation: 'slideIn .2s ease-out',
      }}>
        <div style={{
          flexShrink: 0, padding: '18px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
        }}>
          <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 17, color: 'var(--fg)' }}>Notifications</span>
          <button style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>
          <button onClick={onClose} style={{ marginLeft: 12, background: 'none', border: 'none', color: 'var(--mfg)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', marginBottom: 10 }}>TODAY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { dot: 'var(--accent)', text: <><b>ana</b> matched your Rust/WASM intent — 98%</>, sub: 'community.mention · 12m', path: '/intents/1' },
              { dot: 'var(--accent)', text: <><b>StartUp Camp</b> announced Demo Night</>, sub: 'community.announcement · 1h', path: '/events/1' },
              { dot: 'var(--border)', text: <><b>kai</b> is going to Demo Night</>, sub: 'community.event.rsvp · 3h', path: '/events/1' },
            ].map((n, i) => (
              <button key={i} onClick={() => go(n.path)} style={{
                textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                padding: '11px 12px', borderRadius: 10,
                display: 'flex', gap: 11, alignItems: 'flex-start',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: n.dot, flexShrink: 0, marginTop: 5 }} />
                <div>
                  <div style={{ fontSize: 13, lineHeight: 1.4, color: 'var(--fg)' }}>{n.text}</div>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '10.5px', color: 'var(--mfg)', marginTop: 2 }}>{n.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
