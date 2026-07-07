import { useNavigate } from 'react-router-dom';

const ATTENDEES = [
  { letter: 'A', bg: 'var(--accent)' },
  { letter: 'K', bg: 'var(--success)' },
  { letter: 'T', bg: 'var(--primary)' },
  { letter: 'M', bg: 'hsl(280 40% 55%)' },
];

export default function EventDetail() {
  const nav = useNavigate();

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <button onClick={() => nav('/events')} style={{ background: 'none', border: 'none', color: 'var(--mfg)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 14, fontFamily: 'Inter' }}>← all events</button>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{
          height: 130,
          background: 'linear-gradient(135deg, hsl(191 84% 28%), hsl(14 78% 52%))',
          display: 'flex', alignItems: 'flex-end', padding: '16px 22px',
        }}>
          <div style={{ background: 'rgba(0,0,0,.28)', color: '#fff', fontFamily: "'JetBrains Mono'", fontSize: 11, padding: '5px 10px', borderRadius: 7 }}>THU 9 JUL · 7:00 PM</div>
        </div>
        <div style={{ padding: '22px 24px' }}>
          <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px', margin: '0 0 6px', color: 'var(--fg)' }}>Demo Night</h1>
          <div style={{ fontSize: 14, color: 'var(--mfg)', marginBottom: 16 }}>Cruzio Coworking, 877 Cedar St · hosted by <b style={{ color: 'var(--fg)' }}>StartUp Camp</b></div>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fg)', margin: '0 0 18px' }}>Bring a 3-minute demo of anything you're shipping — code, hardware, a spreadsheet, whatever. Lightning format, friendly crowd, tacos after.</p>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', marginBottom: 10 }}>18 GOING</div>
          <div style={{ display: 'flex', marginBottom: 20 }}>
            {ATTENDEES.map((a, i) => (
              <span key={i} style={{
                width: 32, height: 32, borderRadius: '50%',
                background: a.bg, color: '#fff',
                fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Space Grotesk'",
                border: '2px solid var(--card)',
                marginLeft: i > 0 ? -8 : 0,
              }}>{a.letter}</span>
            ))}
            <span style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--muted)', color: 'var(--mfg)',
              fontSize: 10, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'JetBrains Mono'",
              border: '2px solid var(--card)',
              marginLeft: -8,
            }}>+14</span>
          </div>
        </div>
        <div style={{ padding: '14px 24px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <button style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14, color: '#fff', background: 'var(--primary)', border: 'none', padding: '11px 22px', borderRadius: 10, cursor: 'pointer' }}>Going</button>
          <button style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14, color: 'var(--fg)', border: '1px solid var(--border)', background: 'var(--card)', padding: '11px 18px', borderRadius: 10, cursor: 'pointer' }}>Maybe</button>
          <button style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono'", fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>↓ Add to calendar (.ics)</button>
        </div>
      </div>
    </div>
  );
}
