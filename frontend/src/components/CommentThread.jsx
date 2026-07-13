import { useState, useEffect } from 'react';
import { comments as commentsApi } from '../api';

const AVATAR_COLORS = [
  'var(--accent)', 'var(--success)', 'var(--primary)',
  'hsl(280 40% 55%)', 'hsl(40 70% 48%)', 'hsl(340 60% 50%)',
];

function timeAgo(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d)) return '';
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString();
}

// A comment thread for a piece of content.
// contentType: 'channel' | 'event' | 'announcement'; contentId: string/UUID.
// meId (optional): the current user's id, so they can delete their own comments.
export default function CommentThread({ contentType, contentId, meId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    commentsApi.list(contentType, contentId)
      .then(res => setItems(res.comments || res.items || res.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (contentId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType, contentId]);

  const submit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || posting) return;
    setPosting(true);
    setError(null);
    try {
      await commentsApi.create(contentType, contentId, text);
      setInput('');
      load();
    } catch {
      setError('Could not post comment. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const remove = async (c) => {
    const id = c.id || c._id;
    if (!id || !window.confirm('Delete this comment?')) return;
    try {
      await commentsApi.remove(id);
      setItems(prev => prev.filter(x => (x.id || x._id) !== id));
    } catch { /* ignore; reload will reconcile */ }
  };

  return (
    <div>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', marginBottom: 12 }}>
        COMMENTS{items.length ? ` · ${items.length}` : ''}
      </div>

      <form onSubmit={submit} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add a comment…"
          style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--fg)', fontFamily: 'Inter', fontSize: 14, padding: '9px 12px' }}
        />
        <button type="submit" disabled={posting || !input.trim()} style={{
          fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13, color: '#fff',
          background: 'var(--accent)', border: 'none', padding: '9px 16px', borderRadius: 9,
          cursor: posting ? 'default' : 'pointer', opacity: posting || !input.trim() ? 0.6 : 1, whiteSpace: 'nowrap',
        }}>{posting ? 'Posting…' : 'Post'}</button>
      </form>

      {error && <div style={{ color: 'var(--danger, #e5484d)', fontSize: 12, marginBottom: 10 }}>{error}</div>}

      {loading ? (
        <div style={{ color: 'var(--mfg)', fontSize: 13, padding: '10px 0' }}>Loading comments…</div>
      ) : items.length === 0 ? (
        <div style={{ color: 'var(--mfg)', fontSize: 13, padding: '10px 0' }}>No comments yet. Be the first.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map((c, i) => {
            const name = c.user_name || c.user_id || 'member';
            const letter = name.charAt(0).toUpperCase() || '?';
            const mine = meId && (c.user_id === meId);
            return (
              <div key={c.id || c._id || i} style={{ display: 'flex', gap: 11 }}>
                <span style={{
                  width: 32, height: 32, flexShrink: 0, borderRadius: '50%',
                  background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13,
                }}>{letter}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13.5, color: 'var(--fg)' }}>{name}</span>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)' }}>{timeAgo(c.created_at || c.sent_at)}</span>
                    {mine && (
                      <button onClick={() => remove(c)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--mfg)', fontSize: 11, cursor: 'pointer', fontFamily: "'JetBrains Mono'" }}>delete</button>
                    )}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--fg)', marginTop: 2 }}>{c.comment || c.content}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
