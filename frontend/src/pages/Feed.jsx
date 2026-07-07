import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';
import { get } from '../api';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/api/notifications?limit=20')
      .then(res => setItems(res.events || res.items || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
      <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px', margin: '0 0 18px', color: 'var(--fg)' }}>Activity</h1>

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
