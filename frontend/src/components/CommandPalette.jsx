import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CommandPalette({ onClose }) {
  const nav = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const go = (path) => { onClose(); nav(path); };

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
            placeholder="Search people, events, channels — or ask a question…"
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
        <div style={{ padding: 8 }}>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', padding: '8px 10px 6px' }}>ASK AI</div>
          <button onClick={() => go('/discovery')} style={{
            width: '100%', textAlign: 'left', background: 'none', border: 'none',
            cursor: 'pointer', padding: 10, borderRadius: 9,
            display: 'flex', gap: 11, alignItems: 'center', fontSize: '13.5px', color: 'var(--fg)',
          }}>
            <span style={{ color: 'var(--primary)' }}>✦</span>
            Who can help me ship a Rust→WASM module this week?
          </button>

          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', padding: '8px 10px 6px' }}>JUMP TO</div>
          <button onClick={() => go('/chat')} style={{
            width: '100%', textAlign: 'left', background: 'none', border: 'none',
            cursor: 'pointer', padding: 10, borderRadius: 9,
            display: 'flex', gap: 11, alignItems: 'center', fontSize: '13.5px', color: 'var(--fg)',
          }}>
            <span style={{ fontFamily: "'JetBrains Mono'", color: 'var(--primary)' }}>#</span>
            wasm-pairing
          </button>
          <button onClick={() => go('/events/1')} style={{
            width: '100%', textAlign: 'left', background: 'none', border: 'none',
            cursor: 'pointer', padding: 10, borderRadius: 9,
            display: 'flex', gap: 11, alignItems: 'center', fontSize: '13.5px', color: 'var(--fg)',
          }}>
            <span>📅</span>Demo Night — Thu 7pm
          </button>
          <button onClick={() => go('/profile/ana')} style={{
            width: '100%', textAlign: 'left', background: 'none', border: 'none',
            cursor: 'pointer', padding: 10, borderRadius: 9,
            display: 'flex', gap: 11, alignItems: 'center', fontSize: '13.5px', color: 'var(--fg)',
          }}>
            <span style={{
              width: 20, height: 20, borderRadius: 6,
              background: 'var(--accent)', color: '#fff',
              fontSize: 10, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Space Grotesk'",
            }}>A</span>
            ana · @ana
          </button>
        </div>
      </div>
    </div>
  );
}
