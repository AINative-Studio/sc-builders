import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const INITIAL_EVENTS = [
  { day: 'THU', date: '09', title: 'Demo Night', time: '7:00 PM · Cruzio · hosted by StartUp Camp', avatars: ['A', 'K'], extra: '+16', rsvp: 'going' },
  { day: 'SAT', date: '11', title: 'Beach cleanup + build session', time: '9:00 AM · Its Beach · hosted by mara', rsvp: null },
  { day: 'WED', date: '15', title: 'Fundraising office hours', time: '4:00 PM · Zoom · hosted by SC Angels', rsvp: null },
];

const AVATAR_COLORS = { A: 'var(--accent)', K: 'var(--success)' };

export default function EventsList() {
  const nav = useNavigate();
  const [events, setEvents] = useState(INITIAL_EVENTS);

  function toggleRsvp(index, e) {
    e.stopPropagation();
    setEvents(prev => prev.map((ev, i) => {
      if (i !== index) return ev;
      return { ...ev, rsvp: ev.rsvp === 'going' ? null : 'going' };
    }));
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '26px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px', margin: 0, color: 'var(--fg)', whiteSpace: 'nowrap' }}>Events</h1>
        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: 'var(--mfg)' }}>3 upcoming</span>
        <button style={{ marginLeft: 'auto', fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13, color: '#fff', background: 'var(--accent)', border: 'none', padding: '9px 16px', borderRadius: 9, cursor: 'pointer' }}>+ New event</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {events.map((ev, i) => (
          <div key={i} onClick={() => nav('/events/1')} style={{
            textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '16px 18px',
            display: 'flex', gap: 16, alignItems: 'center', cursor: 'pointer',
          }}>
            <div style={{ flexShrink: 0, width: 56, textAlign: 'center', background: 'var(--muted)', borderRadius: 10, padding: '8px 0' }}>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>{ev.day}</div>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 20, color: 'var(--fg)', lineHeight: 1 }}>{ev.date}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 16, color: 'var(--fg)' }}>{ev.title}</div>
              <div style={{ fontSize: 13, color: 'var(--mfg)', marginTop: 2 }}>{ev.time}</div>
            </div>
            {ev.avatars && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {ev.avatars.map((a, j) => (
                  <span key={j} style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: AVATAR_COLORS[a] || 'var(--muted)',
                    color: '#fff', fontSize: 10, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Space Grotesk'",
                    border: '2px solid var(--card)',
                    marginLeft: j > 0 ? -8 : 0,
                  }}>{a}</span>
                ))}
                {ev.extra && (
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'var(--muted)', color: 'var(--mfg)',
                    fontSize: 9, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'JetBrains Mono'",
                    border: '2px solid var(--card)',
                    marginLeft: -8,
                  }}>{ev.extra}</span>
                )}
              </div>
            )}
            <button onClick={(e) => toggleRsvp(i, e)} style={{
              fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 12,
              color: ev.rsvp === 'going' ? '#fff' : 'var(--primary)',
              background: ev.rsvp === 'going' ? 'var(--primary)' : 'transparent',
              border: ev.rsvp === 'going' ? 'none' : '1px solid var(--border)',
              padding: '8px 14px', borderRadius: 8, flexShrink: 0, cursor: 'pointer',
            }}>{ev.rsvp === 'going' ? 'Going' : 'RSVP'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
