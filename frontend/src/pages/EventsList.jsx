import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post } from '../api';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function EventsList() {
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/api/events?limit=50')
      .then(res => setEvents(res.items || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function toggleRsvp(ev, e) {
    e.stopPropagation();
    const id = ev.id || ev._id;
    try {
      await post(`/api/events/${id}/rsvp`, { status: ev._rsvp === 'going' ? 'cancel' : 'going' });
      setEvents(prev => prev.map(item =>
        (item.id || item._id) === id
          ? { ...item, _rsvp: item._rsvp === 'going' ? null : 'going' }
          : item
      ));
    } catch {}
  }

  function formatDate(dateStr) {
    if (!dateStr) return { day: '', date: '' };
    const d = new Date(dateStr);
    return { day: DAYS[d.getDay()], date: String(d.getDate()).padStart(2, '0') };
  }

  function formatTime(ev) {
    const parts = [];
    if (ev.start_time || ev.date) {
      try {
        const d = new Date(ev.start_time || ev.date);
        parts.push(d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      } catch {}
    }
    if (ev.location) parts.push(ev.location);
    if (ev.host || ev.hosted_by) parts.push(`hosted by ${ev.host || ev.hosted_by}`);
    return parts.join(' · ') || '';
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '26px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px', margin: 0, color: 'var(--fg)', whiteSpace: 'nowrap' }}>Events</h1>
        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: 'var(--mfg)' }}>{events.length} upcoming</span>
        <button style={{ marginLeft: 'auto', fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13, color: '#fff', background: 'var(--accent)', border: 'none', padding: '9px 16px', borderRadius: 9, cursor: 'pointer' }}>+ New event</button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>Loading...</div>
      ) : events.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>No upcoming events</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {events.map((ev) => {
            const { day, date } = formatDate(ev.date || ev.start_time);
            const id = ev.id || ev._id;
            return (
              <div key={id} onClick={() => nav(`/events/${id}`)} style={{
                textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '16px 18px',
                display: 'flex', gap: 16, alignItems: 'center', cursor: 'pointer',
              }}>
                <div style={{ flexShrink: 0, width: 56, textAlign: 'center', background: 'var(--muted)', borderRadius: 10, padding: '8px 0' }}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>{day}</div>
                  <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 20, color: 'var(--fg)', lineHeight: 1 }}>{date}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 16, color: 'var(--fg)' }}>{ev.title || ev.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--mfg)', marginTop: 2 }}>{formatTime(ev)}</div>
                </div>
                {ev.attendee_count > 0 && (
                  <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)' }}>{ev.attendee_count} going</span>
                )}
                <button onClick={(e) => toggleRsvp(ev, e)} style={{
                  fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 12,
                  color: ev._rsvp === 'going' ? '#fff' : 'var(--primary)',
                  background: ev._rsvp === 'going' ? 'var(--primary)' : 'transparent',
                  border: ev._rsvp === 'going' ? 'none' : '1px solid var(--border)',
                  padding: '8px 14px', borderRadius: 8, flexShrink: 0, cursor: 'pointer',
                }}>{ev._rsvp === 'going' ? 'Going' : 'RSVP'}</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
