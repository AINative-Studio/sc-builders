import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../api';

export default function CommandPalette({ onClose }) {
  const nav = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await get(`/api/search?q=${encodeURIComponent(query.trim())}&limit=6`);
        setResults(res.results || []);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const go = (path) => { onClose(); nav(path); };

  function goDiscovery() {
    if (query.trim()) {
      onClose();
      nav(`/discovery?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10,20,25,.45)',
      zIndex: 50,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: 110,
      animation: 'fadeIn .15s ease-out',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 520, maxWidth: '90vw',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: '0 30px 70px -20px rgba(0,0,0,.5)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 11,
          padding: '15px 17px',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ color: 'var(--accent)', fontSize: 16 }}>✦</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') goDiscovery(); }}
            placeholder="Search people, events, channels — or ask a question..."
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontFamily: 'Inter', fontSize: 15, color: 'var(--fg)', outline: 'none',
            }}
          />
          <span style={{
            fontFamily: "'JetBrains Mono'", fontSize: '10.5px', color: 'var(--mfg)',
            border: '1px solid var(--border)', borderRadius: 5, padding: '2px 6px',
          }}>esc</span>
        </div>
        <div style={{ padding: 8, maxHeight: 360, overflow: 'auto' }}>
          {query.trim() && (
            <>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', padding: '8px 10px 6px' }}>ASK AI</div>
              <button onClick={goDiscovery} style={{
                width: '100%', textAlign: 'left', background: 'none', border: 'none',
                cursor: 'pointer', padding: 10, borderRadius: 9,
                display: 'flex', gap: 11, alignItems: 'center', fontSize: '13.5px', color: 'var(--fg)',
              }}>
                <span style={{ color: 'var(--primary)' }}>✦</span>
                {query}
              </button>
            </>
          )}

          {loading && (
            <div style={{ padding: '12px 10px', fontSize: 13, color: 'var(--mfg)' }}>Searching...</div>
          )}

          {!loading && results.length > 0 && (
            <>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', padding: '8px 10px 6px' }}>RESULTS</div>
              {results.map((r, i) => {
                const type = r.type || r.table || '';
                let path = null;
                let icon = '📄';
                if (type === 'events') { path = `/events/${r.id || ''}`; icon = '📅'; }
                else if (type === 'member_directory') { path = `/profile/${r.handle || r.name || ''}`; icon = '👤'; }
                else if (type === 'channels') { path = '/chat'; icon = '#'; }
                else if (type === 'announcements') { path = '/feed'; icon = '📢'; }
                return (
                  <button key={i} onClick={() => path && go(path)} style={{
                    width: '100%', textAlign: 'left', background: 'none', border: 'none',
                    cursor: path ? 'pointer' : 'default', padding: 10, borderRadius: 9,
                    display: 'flex', gap: 11, alignItems: 'center', fontSize: '13.5px', color: 'var(--fg)',
                  }}>
                    <span style={{ fontFamily: type === 'channels' ? "'JetBrains Mono'" : 'inherit', color: 'var(--primary)' }}>{icon}</span>
                    {r.title || r.name || r.display_name || r.content?.substring(0, 60) || 'Result'}
                    {r.score && <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono'", fontSize: 10, color: 'var(--mfg)' }}>{(r.score * 100).toFixed(0)}%</span>}
                  </button>
                );
              })}
            </>
          )}

          {!query.trim() && (
            <>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', padding: '8px 10px 6px' }}>JUMP TO</div>
              <button onClick={() => go('/chat')} style={{
                width: '100%', textAlign: 'left', background: 'none', border: 'none',
                cursor: 'pointer', padding: 10, borderRadius: 9,
                display: 'flex', gap: 11, alignItems: 'center', fontSize: '13.5px', color: 'var(--fg)',
              }}>
                <span style={{ fontFamily: "'JetBrains Mono'", color: 'var(--primary)' }}>#</span>
                general
              </button>
              <button onClick={() => go('/events')} style={{
                width: '100%', textAlign: 'left', background: 'none', border: 'none',
                cursor: 'pointer', padding: 10, borderRadius: 9,
                display: 'flex', gap: 11, alignItems: 'center', fontSize: '13.5px', color: 'var(--fg)',
              }}>
                <span>📅</span>Events
              </button>
              <button onClick={() => go('/members')} style={{
                width: '100%', textAlign: 'left', background: 'none', border: 'none',
                cursor: 'pointer', padding: 10, borderRadius: 9,
                display: 'flex', gap: 11, alignItems: 'center', fontSize: '13.5px', color: 'var(--fg)',
              }}>
                <span>👤</span>Members
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
