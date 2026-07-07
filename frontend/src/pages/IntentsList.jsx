import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';

export default function IntentsList() {
  const nav = useNavigate();

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '26px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px', margin: 0, color: 'var(--fg)', whiteSpace: 'nowrap' }}>Intents</h1>
        <button style={{ marginLeft: 'auto', fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13, color: '#fff', background: 'var(--accent)', border: 'none', padding: '9px 16px', borderRadius: 9, cursor: 'pointer' }}>+ New intent</button>
      </div>
      <p style={{ fontSize: 13, color: 'var(--mfg)', margin: '0 0 20px' }}>Open goals in the community. They stay live until resolved.</p>

      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', marginBottom: 11 }}>YOUR OPEN INTENTS</div>
      <button onClick={() => nav('/intents/1')} style={{
        width: '100%', textAlign: 'left',
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '14px 16px',
        cursor: 'pointer', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <Badge type="INTENT" />
          <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--success)' }}>● OPEN · 3 days</span>
        </div>
        <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '15.5px', color: 'var(--fg)' }}>Looking for a Rust / WASM developer</div>
        <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '11.5px', color: 'var(--mfg)', marginTop: 4 }}>5 matches · 2 intros · 1 awaiting reply</div>
      </button>

      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', marginBottom: 11 }}>COMMUNITY INTENTS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {[
          { letter: 'M', bg: 'hsl(280 40% 55%)', text: <><b>mara</b> is offering <b>design reviews</b> for pre-seed founders</>, sub: 'offer · 6 responses' },
          { letter: 'J', bg: 'hsl(40 70% 48%)', text: <><b>jules</b> needs <b>beta testers</b> for a scheduling app</>, sub: 'find · 11 responses' },
        ].map((item, i) => (
          <button key={i} onClick={() => nav('/intents/1')} style={{
            width: '100%', textAlign: 'left',
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '13px 15px',
            cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center',
          }}>
            <span style={{
              width: 32, height: 32, flexShrink: 0, borderRadius: 9,
              background: item.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13,
            }}>{item.letter}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13.5px', color: 'var(--fg)' }}>{item.text}</div>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', marginTop: 2 }}>{item.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
