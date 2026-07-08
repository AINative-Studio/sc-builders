import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post } from '../api';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const eventStart = (ev) => ev.starts_at || ev.start_time || ev.date;

export default function EventsList() {
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', location: '', starts_at: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);

  const load = () =>
    get('/api/events?limit=50')
      .then(res => setEvents(res.items || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  async function toggleRsvp(ev, e) {
    e.stopPropagation();
    const id = ev.id || ev._id || ev.row_id;
    const next = ev._rsvp === 'going' ? 'not_going' : 'going';
    try {
      await post(`/api/events/${id}/rsvp`, { status: next });
      setEvents(prev => prev.map(item =>
        (item.id || item._id || item.row_id) === id ? { ...item, _rsvp: next } : item
      ));
    } catch {}
  }

  async function submitEvent(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.starts_at || submitting) return;
    setSubmitting(true);
    setCreateError(null);
    try {
      // datetime-local yields "YYYY-MM-DDTHH:mm"; send as ISO.
      const starts = new Date(form.starts_at).toISOString();
      await post('/api/events', { ...form, title: form.title.trim(), starts_at: starts });
      setForm({ title: '', location: '', starts_at: '', description: '' });
      setCreating(false);
      await load();
    } catch (err) {
      setCreateError(err?.status === 403 ? 'Only organizers can create events.' : 'Could not create event.');
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return { day: '', date: '' };
    const d = new Date(dateStr);
    if (isNaN(d)) return { day: '', date: '' };
    return { day: DAYS[d.getDay()], date: String(d.getDate()).padStart(2, '0') };
  }

  function formatTime(ev) {
    const parts = [];
    const raw = eventStart(ev);
    if (raw) {
      const d = new Date(raw);
      if (!isNaN(d)) parts.push(d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
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
        <button onClick={() => setCreating(c => !c)} style={{ marginLeft: 'auto', fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13, color: '#fff', background: 'var(--accent)', border: 'none', padding: '9px 16px', borderRadius: 9, cursor: 'pointer' }}>{creating ? 'Cancel' : '+ New event'}</button>
      </div>

      {creating && (
        <form onSubmit={submitEvent} style={{ marginBottom: 22, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" autoFocus
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--fg)', fontFamily: 'Inter', fontSize: 14, padding: '10px 12px' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
              style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--fg)', fontFamily: 'Inter', fontSize: 14, padding: '10px 12px' }} />
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Location"
              style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--fg)', fontFamily: 'Inter', fontSize: 14, padding: '10px 12px' }} />
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (optional)" rows={2}
            style={{ resize: 'vertical', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--fg)', fontFamily: 'Inter', fontSize: 14, padding: '10px 12px' }} />
          {createError && <div style={{ color: 'var(--danger, #e5484d)', fontSize: 12 }}>{createError}</div>}
          <button type="submit" disabled={submitting || !form.title.trim() || !form.starts_at} style={{
            alignSelf: 'flex-start', fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13, color: '#fff',
            background: 'var(--accent)', border: 'none', padding: '9px 18px', borderRadius: 9,
            cursor: submitting ? 'default' : 'pointer', opacity: submitting || !form.title.trim() || !form.starts_at ? 0.6 : 1,
          }}>{submitting ? 'Creating…' : 'Create event'}</button>
        </form>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>Loading...</div>
      ) : events.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>No upcoming events</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {events.map((ev) => {
            const { day, date } = formatDate(eventStart(ev));
            const id = ev.id || ev._id || ev.row_id;
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
