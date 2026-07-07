import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';

export default function Discover() {
  const nav = useNavigate();

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '52px 32px 40px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, letterSpacing: '1.5px', color: 'var(--mfg)', marginBottom: 14 }}>
          SANTA CRUZ BUILDERS · <span style={{ color: 'var(--success)' }}>42 online</span>
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 32, letterSpacing: '-.6px', margin: '0 0 22px', lineHeight: 1.12, color: 'var(--fg)' }}>
          What do you need from<br />the community today?
        </h1>
        <button onClick={() => nav('/discovery')} style={{
          width: '100%', maxWidth: 560,
          background: 'var(--card)', border: '1.5px solid var(--border)',
          borderRadius: 14, boxShadow: '0 4px 16px rgba(20,40,50,.06)',
          padding: '15px 17px',
          display: 'flex', alignItems: 'center', gap: 12,
          cursor: 'pointer', textAlign: 'left',
        }}>
          <span style={{ color: 'var(--accent)', fontSize: 17 }}>✦</span>
          <span style={{ flex: 1, fontSize: 15, color: 'var(--mfg)' }}>Who can help me ship a Rust→WASM module this week?</span>
          <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 6px' }}>↵</span>
        </button>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
          {[
            { label: '+ post an intent', action: () => nav('/intents'), primary: true },
            { label: "who's hiring?", action: () => nav('/discovery') },
            { label: 'beta testers', action: () => nav('/discovery') },
            { label: 'local grants', action: () => nav('/discovery') },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action} style={{
              fontFamily: "'JetBrains Mono'", fontSize: '11.5px',
              background: btn.primary ? 'var(--card)' : 'var(--muted)',
              border: btn.primary ? '1px solid var(--border)' : 'none',
              borderRadius: 20, padding: '6px 13px',
              color: btn.primary ? 'var(--primary)' : 'var(--mfg)',
              cursor: 'pointer',
            }}>{btn.label}</button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 38 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14, color: 'var(--fg)' }}>Live in the graph</span>
          <button onClick={() => nav('/feed')} style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', background: 'none', border: 'none', cursor: 'pointer' }}>activity feed →</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => nav('/intents/1')} style={{
            textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '13px 15px',
            display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer',
          }}>
            <Badge type="INTENT" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13.5px', lineHeight: 1.45, color: 'var(--fg)' }}><b style={{ fontFamily: "'Space Grotesk'", fontWeight: 600 }}>ana</b> is looking to <b>pair on WASM</b> · offers Rust, needs JS glue</div>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', marginTop: 3 }}>3 matches · 4m ago</div>
            </div>
            <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 12, color: '#fff', background: 'var(--primary)', padding: '7px 13px', borderRadius: 8, flexShrink: 0 }}>Respond</span>
          </button>

          <button onClick={() => nav('/events/1')} style={{
            textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '13px 15px',
            display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer',
          }}>
            <Badge type="EVENT" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13.5px', lineHeight: 1.45, color: 'var(--fg)' }}><b style={{ fontFamily: "'Space Grotesk'", fontWeight: 600 }}>Demo Night</b> — Thu 7pm @ Cruzio · 18 going</div>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', marginTop: 3 }}>hosted by StartUp Camp</div>
            </div>
            <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 12, color: 'var(--primary)', border: '1px solid var(--border)', padding: '7px 13px', borderRadius: 8, flexShrink: 0 }}>RSVP</span>
          </button>

          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '13px 15px',
            display: 'flex', gap: 12, alignItems: 'center',
          }}>
            <Badge type="SERVICE" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13.5px', lineHeight: 1.45, color: 'var(--fg)' }}><b style={{ fontFamily: "'Space Grotesk'", fontWeight: 600 }}>Cruzio</b> added <b>fiber for co-ops</b> to Services</div>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', marginTop: 3 }}>new node · agent-readable</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
