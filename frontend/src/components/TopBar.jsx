import { useState, useEffect } from 'react';
import { get } from '../api';

export default function TopBar({ onOpenPalette, onOpenNotif, notifCount }) {
  const [presence, setPresence] = useState(0);

  useEffect(() => {
    get('/ws/stats')
      .then(res => setPresence(res.active_connections || res.online || 0))
      .catch(() => setPresence(0));

    const id = setInterval(() => {
      get('/ws/stats')
        .then(res => setPresence(res.active_connections || res.online || 0))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const count = notifCount ?? 0;

  return (
    <div style={{
      flexShrink: 0,
      height: 56,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 20px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--card)',
    }}>
      <button
        onClick={onOpenPalette}
        style={{
          flex: 1,
          maxWidth: 420,
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '8px 12px',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ color: 'var(--mfg)', fontSize: 14 }}>⌕</span>
        <span style={{ flex: 1, fontSize: 13, color: 'var(--mfg)' }}>Search or ask the community...</span>
        <span style={{
          fontFamily: "'JetBrains Mono'",
          fontSize: '10.5px',
          color: 'var(--mfg)',
          border: '1px solid var(--border)',
          borderRadius: 5,
          padding: '2px 5px',
        }}>⌘K</span>
      </button>

      <div style={{
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: "'JetBrains Mono'",
        fontSize: '11.5px',
        color: 'var(--mfg)',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: presence > 0 ? 'var(--success)' : 'var(--mfg)' }} />
        {presence > 0 ? `${presence} online` : 'offline'}
      </div>

      <button
        onClick={onOpenNotif}
        style={{
          position: 'relative',
          width: 38, height: 38,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: 17,
          color: 'var(--fg)',
        }}
      >
        🔔
        {count > 0 && (
          <span style={{
            position: 'absolute',
            top: 6, right: 6,
            minWidth: 15, height: 15,
            background: 'var(--accent)',
            color: '#fff',
            fontFamily: "'JetBrains Mono'",
            fontSize: 9,
            fontWeight: 600,
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
          }}>{count > 99 ? '99+' : count}</span>
        )}
      </button>
    </div>
  );
}
