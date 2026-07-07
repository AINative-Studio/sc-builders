import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';

export default function IntentDetail() {
  const nav = useNavigate();

  const timeline = [
    { color: 'var(--success)', text: <><b>ana</b> responded — available Thu afternoon</>, sub: '12m ago · match 98%', subColor: 'var(--success)' },
    { color: 'var(--primary)', text: <>AI introduced you to <b>ana</b> and <b>kai</b></>, sub: '1h ago · auto-matched' },
    { color: 'var(--accent)', text: <><b>kai</b> hasn't replied yet</>, sub: 'waiting · nudge available' },
    { color: 'hsl(200 12% 60%)', text: 'Intent posted · 5 candidates found', sub: '3 days ago', last: true },
  ];

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <button onClick={() => nav('/intents')} style={{ background: 'none', border: 'none', color: 'var(--mfg)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 14, fontFamily: 'Inter' }}>← all intents</button>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Badge type="INTENT" />
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--success)' }}>● OPEN · 3 days</span>
          </div>
          <h2 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 22, letterSpacing: '-.3px', margin: '0 0 4px', lineHeight: 1.2, color: 'var(--fg)' }}>Looking for a Rust / WASM developer</h2>
          <div style={{ fontSize: 13, color: 'var(--mfg)' }}>posted by <b style={{ color: 'var(--fg)' }}>toby</b> · #wasm #rust #pairing</div>
        </div>

        <div style={{ padding: '16px 24px', background: 'var(--muted)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
          {[
            { val: 5, label: 'matches', color: 'var(--primary)' },
            { val: 2, label: 'intros made', color: 'var(--primary)' },
            { val: 1, label: 'awaiting reply', color: 'var(--accent)' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {i > 0 && <div style={{ width: 1, height: 40, background: 'var(--border)' }} />}
              <div>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 22, color: s.color }}>{s.val}</div>
                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: 'var(--mfg)', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '18px 24px' }}>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', marginBottom: 14 }}>LIFECYCLE</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {timeline.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color }} />
                  {!t.last && <span style={{ flex: 1, width: 2, background: 'var(--border)' }} />}
                </div>
                <div style={{ paddingBottom: t.last ? 0 : 16 }}>
                  <div style={{ fontSize: '13.5px', lineHeight: 1.4, color: 'var(--fg)' }}>{t.text}</div>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', marginTop: 2 }}>
                    {t.sub.split(' · ').map((part, j) => (
                      <span key={j}>{j > 0 && ' · '}<span style={t.subColor && j === t.sub.split(' · ').length - 1 ? { color: t.subColor } : {}}>{part}</span></span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '14px 24px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <button style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13, color: '#fff', background: 'var(--accent)', padding: '10px 18px', border: 'none', borderRadius: 9, cursor: 'pointer' }}>Nudge kai</button>
          <button onClick={() => nav('/discovery')} style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13, color: 'var(--fg)', border: '1px solid var(--border)', background: 'var(--card)', padding: '10px 16px', borderRadius: 9, cursor: 'pointer' }}>Let agent handle</button>
          <button style={{ marginLeft: 'auto', fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13, color: 'var(--success)', background: 'none', border: 'none', cursor: 'pointer' }}>Mark resolved</button>
        </div>
      </div>
    </div>
  );
}
