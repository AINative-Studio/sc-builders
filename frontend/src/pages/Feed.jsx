import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';

export default function Feed() {
  const nav = useNavigate();

  const today = [
    { type: 'MATCH', text: <>AI matched your intent <b>Rust/WASM dev</b> with <b>ana</b> — 98%.</>, link: '/intents/1', linkText: 'view →', time: '12m ago' },
    { type: 'ANNOUNCE', text: <><b>StartUp Camp</b> posted: Demo Night is Thursday 7pm.</>, time: '1h ago · pinned' },
    { type: 'NODE', text: <><b>Cruzio</b> added a new Service: <b>fiber for co-ops</b>.</>, time: '2h ago' },
  ];

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '26px 24px' }}>
      <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px', margin: '0 0 18px', color: 'var(--fg)' }}>Activity</h1>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', marginBottom: 12 }}>TODAY</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 22 }}>
        {today.map((item, i) => (
          <div key={i} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '13px 15px',
            display: 'flex', gap: 11, alignItems: 'flex-start',
          }}>
            <Badge type={item.type} />
            <div style={{ flex: 1, fontSize: '13.5px', lineHeight: 1.45, color: 'var(--fg)' }}>
              {item.text}
              {item.link && (
                <button onClick={() => nav(item.link)} style={{ color: 'var(--primary)', background: 'none', border: 'none', fontSize: '13.5px', cursor: 'pointer', fontWeight: 600, padding: 0, fontFamily: 'Inter' }}> {item.linkText}</button>
              )}
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', marginTop: 3 }}>{item.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', marginBottom: 12 }}>EARLIER</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '13px 15px',
          display: 'flex', gap: 11, alignItems: 'flex-start',
        }}>
          <Badge type="RSVP" />
          <div style={{ flex: 1, fontSize: '13.5px', lineHeight: 1.45, color: 'var(--fg)' }}>
            <b>kai</b> is going to Demo Night.
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', marginTop: 3 }}>yesterday</div>
          </div>
        </div>
      </div>
    </div>
  );
}
