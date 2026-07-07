import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';
import { get } from '../api';

export default function Discover() {
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    get('/api/events?limit=3').then(res => setEvents(res.items || res.data || [])).catch(() => {});
    get('/api/announcements/pinned?limit=3').then(res => setAnnouncements(res.items || res.data || [])).catch(() => {});
    get('/ws/stats').then(res => setOnlineCount(res.active_connections || 0)).catch(() => {});
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      nav(`/discovery?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      nav('/discovery');
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '52px 32px 40px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, letterSpacing: '1.5px', color: 'var(--mfg)', marginBottom: 14 }}>
          SANTA CRUZ BUILDERS{onlineCount > 0 ? <> · <span style={{ color: 'var(--success)' }}>{onlineCount} online</span></> : ''}
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 32, letterSpacing: '-.6px', margin: '0 0 22px', lineHeight: 1.12, color: 'var(--fg)' }}>
          What do you need from<br />the community today?
        </h1>
        <form onSubmit={handleSearch} style={{
          width: '100%', maxWidth: 560, margin: '0 auto',
          background: 'var(--card)', border: '1.5px solid var(--border)',
          borderRadius: 14, boxShadow: '0 4px 16px rgba(20,40,50,.06)',
          padding: '15px 17px',
          display: 'flex', alignItems: 'center', gap: 12,
          textAlign: 'left',
        }}>
          <span style={{ color: 'var(--accent)', fontSize: 17 }}>✦</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search people, events, businesses..."
            style={{ flex: 1, fontSize: 15, color: 'var(--fg)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Inter' }}
          />
          <button type="submit" style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 6px', background: 'transparent', cursor: 'pointer' }}>↵</button>
        </form>
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
          {announcements.map((a, i) => (
            <div key={a.id || a._id || `ann-${i}`} style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '13px 15px',
              display: 'flex', gap: 12, alignItems: 'center',
            }}>
              <Badge type="ANNOUNCE" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13.5px', lineHeight: 1.45, color: 'var(--fg)' }}><b style={{ fontFamily: "'Space Grotesk'", fontWeight: 600 }}>{a.title}</b></div>
                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', marginTop: 3 }}>{a.channel_slug ? `#${a.channel_slug}` : 'pinned'}</div>
              </div>
            </div>
          ))}

          {events.map((ev) => {
            const id = ev.id || ev._id;
            return (
              <button key={id} onClick={() => nav(`/events/${id}`)} style={{
                textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '13px 15px',
                display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer',
              }}>
                <Badge type="EVENT" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13.5px', lineHeight: 1.45, color: 'var(--fg)' }}>
                    <b style={{ fontFamily: "'Space Grotesk'", fontWeight: 600 }}>{ev.title || ev.name}</b>
                    {ev.location && <> — {ev.location}</>}
                    {ev.attendee_count > 0 && <> · {ev.attendee_count} going</>}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', marginTop: 3 }}>
                    {(ev.host || ev.hosted_by) ? `hosted by ${ev.host || ev.hosted_by}` : ''}
                  </div>
                </div>
                <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 12, color: 'var(--primary)', border: '1px solid var(--border)', padding: '7px 13px', borderRadius: 8, flexShrink: 0 }}>RSVP</span>
              </button>
            );
          })}

          {events.length === 0 && announcements.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--mfg)' }}>No recent activity</div>
          )}
        </div>
      </div>
    </div>
  );
}
