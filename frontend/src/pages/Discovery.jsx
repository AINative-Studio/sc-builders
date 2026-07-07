import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';

export default function Discovery() {
  const nav = useNavigate();

  const results = [
    { letter: 'A', bg: 'var(--accent)', name: 'ana', badge: 'PERSON', match: '98% match', matchColor: 'var(--success)', desc: 'Rust systems dev · open intent: pair on WASM', action: 'Intro', actionBg: 'var(--primary)', actionColor: '#fff', path: '/profile/ana' },
    { letter: 'C', bg: 'var(--success)', name: 'Cruzio', badge: 'SERVICE', match: '71% match', matchColor: 'var(--mfg)', desc: 'Desk space + fiber · pairing rooms bookable', action: 'View', actionBorder: true },
    { letter: '#w', bg: 'var(--primary)', name: '#wasm-pairing', badge: 'CHANNEL', desc: 'active pairing thread · 12 members', action: 'Open', actionBorder: true, path: '/chat' },
  ];

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <div style={{
        background: 'var(--bg)', border: '1.5px solid hsl(191 84% 28% / .4)',
        borderRadius: 12, padding: '13px 15px',
        display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18,
      }}>
        <span style={{ color: 'var(--primary)', fontSize: 16 }}>✦</span>
        <span style={{ flex: 1, fontSize: '14.5px', fontWeight: 500, color: 'var(--fg)' }}>Who can help me ship a Rust→WASM module this week?</span>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
        <span style={{ color: 'var(--primary)', fontSize: 15, marginTop: 1 }}>✦</span>
        <div style={{ fontSize: '13.5px', lineHeight: 1.55, color: 'var(--fg)' }}>Three strong matches in the graph. <b>ana</b> just posted a matching intent, and <b>Cruzio</b> offers a fitting service.</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {results.map((r, i) => (
          <button key={i} onClick={() => r.path && nav(r.path)} style={{
            textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '13px 15px',
            display: 'flex', gap: 12, alignItems: 'center',
            cursor: r.path ? 'pointer' : 'default',
          }}>
            <span style={{
              width: 38, height: 38, flexShrink: 0, borderRadius: 10,
              background: r.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontFamily: "'Space Grotesk'", fontWeight: 600,
              fontSize: r.letter.length > 1 ? 13 : 16,
            }}>{r.letter}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '14.5px', color: 'var(--fg)' }}>{r.name}</span>
                <Badge type={r.badge} />
                {r.match && <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: r.matchColor, whiteSpace: 'nowrap' }}>{r.match}</span>}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--mfg)', marginTop: 2 }}>{r.desc}</div>
            </div>
            <span style={{
              fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 12,
              color: r.actionColor || 'var(--primary)',
              background: r.actionBg || 'transparent',
              border: r.actionBorder ? '1px solid var(--border)' : 'none',
              padding: '7px 13px', borderRadius: 8,
            }}>{r.action}</span>
          </button>
        ))}
      </div>

      <div style={{
        marginTop: 18, background: 'hsl(200 20% 12%)', borderRadius: 11,
        padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 11,
      }}>
        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: '9.5px', fontWeight: 600, background: 'var(--accent)', color: '#fff', padding: '3px 7px', borderRadius: 5, whiteSpace: 'nowrap' }}>AGENT↔AGENT</span>
        <span style={{ fontSize: '12.5px', color: 'hsl(36 20% 90%)', flex: 1, lineHeight: 1.4 }}>Let my agent negotiate a pairing slot with ana's agent</span>
        <button style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 12, color: 'hsl(200 20% 12%)', background: 'hsl(36 20% 90%)', padding: '7px 12px', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Delegate</button>
      </div>
    </div>
  );
}
