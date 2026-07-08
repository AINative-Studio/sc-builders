import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { get, post } from '../api';

const AVATAR_COLORS = [
  'var(--accent)', 'var(--success)', 'var(--primary)',
  'hsl(280 40% 55%)', 'hsl(40 70% 48%)', 'hsl(340 60% 50%)',
];

export default function EventDetail() {
  const nav = useNavigate();
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [rsvp, setRsvp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);

  const loadAttendees = () =>
    get(`/api/events/${id}/attendees`)
      .then(att => setAttendees(att?.items || att?.data || []))
      .catch(() => setAttendees([]));

  useEffect(() => {
    Promise.all([
      get(`/api/events/${id}`).catch(() => null),
      get(`/api/events/${id}/attendees`).catch(() => ({ items: [] })),
      get('/api/members/me').catch(() => null),
    ]).then(([ev, att, meRes]) => {
      if (ev) setEvent(ev);
      const list = att?.items || att?.data || [];
      setAttendees(list);
      const myId = meRes?.row_data?.user_id || meRes?.user_id || meRes?.id;
      setMe(myId);
      // Reflect an existing RSVP so the button shows as active on reload.
      const mine = list.find(a => (a.user_id || a.id) === myId);
      if (mine?.status) setRsvp(mine.status);
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleRsvp(status) {
    const next = rsvp === status ? null : status;
    setRsvp(status);
    try {
      await post(`/api/events/${id}/rsvp`, { status });
      await loadAttendees(); // refresh count/list
    } catch {
      setRsvp(next === status ? null : rsvp);
    }
  }

  function formatDate(ev) {
    const raw = ev?.starts_at || ev?.start_time || ev?.date;
    if (!raw) return '';
    const d = new Date(raw);
    if (isNaN(d)) return '';
    return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()
      + ' · ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  const btnStyle = (active) => ({
    fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14,
    color: active ? '#fff' : 'var(--fg)',
    background: active ? 'var(--primary)' : 'var(--card)',
    border: active ? 'none' : '1px solid var(--border)',
    padding: active ? '11px 22px' : '11px 18px',
    borderRadius: 10, cursor: 'pointer',
  });

  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
        <button onClick={() => nav('/events')} style={{ background: 'none', border: 'none', color: 'var(--mfg)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 14, fontFamily: 'Inter' }}>← all events</button>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>Event not found</div>
      </div>
    );
  }

  const going = attendees.filter(a => (a.status || 'going') === 'going');
  const goingCount = going.length;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <button onClick={() => nav('/events')} style={{ background: 'none', border: 'none', color: 'var(--mfg)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 14, fontFamily: 'Inter' }}>← all events</button>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{
          height: 130,
          background: 'linear-gradient(135deg, hsl(191 84% 28%), hsl(14 78% 52%))',
          display: 'flex', alignItems: 'flex-end', padding: '16px 22px',
        }}>
          <div style={{ background: 'rgba(0,0,0,.28)', color: '#fff', fontFamily: "'JetBrains Mono'", fontSize: 11, padding: '5px 10px', borderRadius: 7 }}>{formatDate(event)}</div>
        </div>
        <div style={{ padding: '22px 24px' }}>
          <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px', margin: '0 0 6px', color: 'var(--fg)' }}>{event.title || event.name}</h1>
          <div style={{ fontSize: 14, color: 'var(--mfg)', marginBottom: 16 }}>
            {event.location && <>{event.location} · </>}
            {(event.host || event.hosted_by) && <>hosted by <b style={{ color: 'var(--fg)' }}>{event.host || event.hosted_by}</b></>}
          </div>
          {event.description && (
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fg)', margin: '0 0 18px' }}>{event.description}</p>
          )}
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', marginBottom: 10 }}>{goingCount} GOING</div>
          {going.length > 0 && (
            <div style={{ display: 'flex', marginBottom: 20 }}>
              {going.slice(0, 5).map((a, i) => {
                const name = a.user_name || a.display_name || a.name || a.user_id || '';
                const letter = name.charAt(0).toUpperCase() || '?';
                return (
                  <span key={i} style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: '#fff',
                    fontSize: 12, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Space Grotesk'",
                    border: '2px solid var(--card)',
                    marginLeft: i > 0 ? -8 : 0,
                  }}>{letter}</span>
                );
              })}
              {goingCount > 5 && (
                <span style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--muted)', color: 'var(--mfg)',
                  fontSize: 10, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'JetBrains Mono'",
                  border: '2px solid var(--card)',
                  marginLeft: -8,
                }}>+{goingCount - 5}</span>
              )}
            </div>
          )}
        </div>
        <div style={{ padding: '14px 24px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => handleRsvp('going')} style={btnStyle(rsvp === 'going')}>Going</button>
          <button onClick={() => handleRsvp('maybe')} style={btnStyle(rsvp === 'maybe')}>Maybe</button>
          <button onClick={() => handleRsvp('not_going')} style={btnStyle(rsvp === 'not_going')}>Can't go</button>
        </div>
      </div>
    </div>
  );
}
