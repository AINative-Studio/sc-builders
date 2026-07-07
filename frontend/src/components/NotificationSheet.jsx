import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post } from '../api';

export default function NotificationSheet({ onClose, onCountChange }) {
  const nav = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/api/notifications?limit=30')
      .then(res => {
        const items = res.events || res.items || res.data || [];
        setNotifications(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const go = (path) => { onClose(); nav(path); };

  async function markAllRead() {
    try {
      await post('/api/notifications/read-all', {});
      setNotifications(prev => prev.map(n => ({ ...n, _read: true })));
      if (onCountChange) onCountChange(0);
    } catch {}
  }

  function getNotifPath(n) {
    const type = n.type || '';
    if (type.includes('event')) return '/events';
    if (type.includes('announcement')) return '/feed';
    if (type.includes('mention') || type.includes('intent')) return '/intents';
    if (type.includes('message')) return '/chat';
    return '/feed';
  }

  function getNotifText(n) {
    const data = n.data || {};
    if (data.title) return data.title;
    if (data.content) return data.content.substring(0, 80);
    return n.type || 'Notification';
  }

  function getNotifTime(n) {
    if (!n.created_at && !n.timestamp) return '';
    const d = new Date(n.created_at || n.timestamp);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString();
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,25,.4)', zIndex: 40 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 360,
        background: 'var(--card)', borderLeft: '1px solid var(--border)',
        zIndex: 41, display: 'flex', flexDirection: 'column',
        boxShadow: '-16px 0 40px -20px rgba(0,0,0,.4)',
        animation: 'slideIn .2s ease-out',
      }}>
        <div style={{
          flexShrink: 0, padding: '18px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
        }}>
          <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 17, color: 'var(--fg)' }}>Notifications</span>
          <button onClick={markAllRead} style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>
          <button onClick={onClose} style={{ marginLeft: 12, background: 'none', border: 'none', color: 'var(--mfg)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--mfg)' }}>Loading...</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--mfg)' }}>No notifications</div>
          ) : (
            <>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', marginBottom: 10 }}>RECENT</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {notifications.map((n, i) => (
                  <button key={n.id || n._id || i} onClick={() => go(getNotifPath(n))} style={{
                    textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                    padding: '11px 12px', borderRadius: 10,
                    display: 'flex', gap: 11, alignItems: 'flex-start',
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: n._read ? 'var(--border)' : 'var(--accent)', flexShrink: 0, marginTop: 5 }} />
                    <div>
                      <div style={{ fontSize: 13, lineHeight: 1.4, color: 'var(--fg)' }}>{getNotifText(n)}</div>
                      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '10.5px', color: 'var(--mfg)', marginTop: 2 }}>
                        {n.type || ''}{getNotifTime(n) ? ` · ${getNotifTime(n)}` : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
