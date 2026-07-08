import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';
import { get, post } from '../api';

function typeToBadge(type) {
  if (!type) return 'NODE';
  if (type.includes('event')) return 'EVENT';
  if (type.includes('announcement')) return 'ANNOUNCE';
  if (type.includes('rsvp')) return 'RSVP';
  if (type.includes('mention') || type.includes('match') || type.includes('intent')) return 'MATCH';
  if (type.includes('message')) return 'NODE';
  return 'NODE';
}

function timeAgo(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diffMin = Math.floor((now - d) / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString();
}

export default function Feed() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [pinned, setPinned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null);

  const loadPinned = () =>
    get('/api/announcements/pinned?limit=10')
      .then(res => setPinned(res.items || res.data || []))
      .catch(() => setPinned([]));

  useEffect(() => {
    get('/api/notifications?limit=20')
      .then(res => setItems(res.events || res.items || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    loadPinned();
  }, []);

  async function postAnnouncement(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim() || posting) return;
    setPosting(true);
    setPostError(null);
    try {
      await post('/api/announcements', { title: form.title.trim(), body: form.body.trim(), pinned: true });
      setForm({ title: '', body: '' });
      setComposing(false);
      await loadPinned();
    } catch (err) {
      setPostError(err?.status === 403 ? 'Only organizers can post announcements.' : 'Could not post announcement.');
    } finally {
      setPosting(false);
    }
  }

  function getPath(item) {
    const type = item.type || '';
    if (type.includes('event')) return '/events';
    if (type.includes('announcement')) return '/feed';
    if (type.includes('intent') || type.includes('match')) return '/intents';
    if (type.includes('rsvp')) return '/events';
    return null;
  }

  function getText(item) {
    const data = item.data || {};
    if (data.title) return data.title;
    if (data.content) return data.content.substring(0, 100);
    return item.type || 'Activity';
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '26px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 18 }}>
        <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px', margin: 0, color: 'var(--fg)' }}>Activity</h1>
        <button onClick={() => setComposing(c => !c)} style={{ marginLeft: 'auto', fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13, color: '#fff', background: 'var(--accent)', border: 'none', padding: '9px 16px', borderRadius: 9, cursor: 'pointer' }}>
          {composing ? 'Cancel' : '+ Announcement'}
        </button>
      </div>

      {composing && (
        <form onSubmit={postAnnouncement} style={{ marginBottom: 22, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title" autoFocus
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--fg)', fontFamily: 'Inter', fontSize: 14, padding: '10px 12px' }} />
          <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="What's happening?" rows={3}
            style={{ resize: 'vertical', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--fg)', fontFamily: 'Inter', fontSize: 14, padding: '10px 12px' }} />
          {postError && <div style={{ color: 'var(--danger, #e5484d)', fontSize: 12 }}>{postError}</div>}
          <button type="submit" disabled={posting || !form.title.trim() || !form.body.trim()} style={{
            alignSelf: 'flex-start', fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13, color: '#fff',
            background: 'var(--accent)', border: 'none', padding: '9px 18px', borderRadius: 9,
            cursor: posting ? 'default' : 'pointer', opacity: posting || !form.title.trim() || !form.body.trim() ? 0.6 : 1,
          }}>{posting ? 'Posting…' : 'Post announcement'}</button>
        </form>
      )}

      {pinned.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', marginBottom: 12 }}>📌 PINNED</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {pinned.map((a, i) => (
              <div key={a.id || a._row_id || i} style={{ background: 'var(--card)', border: '1px solid var(--accent)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <Badge type="ANNOUNCE" />
                  <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15, color: 'var(--fg)' }}>{a.title}</span>
                </div>
                <div style={{ fontSize: '13.5px', lineHeight: 1.5, color: 'var(--fg)' }}>{a.body}</div>
                {(a.published_at || a.created_at) && (
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', marginTop: 5 }}>{timeAgo(a.published_at || a.created_at)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>Loading...</div>
      ) : items.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>No recent activity</div>
      ) : (
        <>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', marginBottom: 12 }}>RECENT</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {items.map((item, i) => {
              const path = getPath(item);
              return (
                <div key={item.id || item._id || i} onClick={() => path && nav(path)} style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '13px 15px',
                  display: 'flex', gap: 11, alignItems: 'flex-start',
                  cursor: path ? 'pointer' : 'default',
                }}>
                  <Badge type={typeToBadge(item.type)} />
                  <div style={{ flex: 1, fontSize: '13.5px', lineHeight: 1.45, color: 'var(--fg)' }}>
                    {getText(item)}
                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', marginTop: 3 }}>
                      {item.type || ''}{item.created_at || item.timestamp ? ` · ${timeAgo(item.created_at || item.timestamp)}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
