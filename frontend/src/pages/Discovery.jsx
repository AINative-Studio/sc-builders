import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';
import { get } from '../api';

export default function Discovery() {
  const nav = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const [semantic, prospect] = await Promise.all([
        get(`/api/search/semantic?q=${encodeURIComponent(query.trim())}&limit=5`).catch(() => ({ results: [] })),
        get(`/api/search/prospect?q=${encodeURIComponent(query.trim())}&limit=5`).catch(() => ({ results: [] })),
      ]);

      const combined = [];

      (semantic.results || []).forEach(r => {
        combined.push({
          name: r.source || r.collection || 'Match',
          badge: 'MATCH',
          desc: r.text?.substring(0, 120) || '',
          score: r.score ? `${(r.score * 100).toFixed(0)}%` : null,
        });
      });

      (prospect.results || prospect.data || []).forEach(r => {
        combined.push({
          name: r.business_name || r.name || 'Business',
          badge: 'SERVICE',
          desc: [r.category, r.city, r.address].filter(Boolean).join(' · '),
          score: r.score ? `${(r.score * 100).toFixed(0)}%` : null,
          path: null,
        });
      });

      setResults(combined);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }

  const AVATAR_COLORS = ['var(--accent)', 'var(--success)', 'var(--primary)', 'hsl(280 40% 55%)', 'hsl(40 70% 48%)'];

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <form onSubmit={handleSearch} style={{
        background: 'var(--bg)', border: '1.5px solid hsl(191 84% 28% / .4)',
        borderRadius: 12, padding: '13px 15px',
        display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18,
      }}>
        <span style={{ color: 'var(--primary)', fontSize: 16 }}>✦</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ask the community graph anything..."
          style={{ flex: 1, fontSize: '14.5px', fontWeight: 500, color: 'var(--fg)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Inter' }}
        />
        <button type="submit" style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--primary)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>↵</button>
      </form>

      {loading && (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--mfg)' }}>Searching...</div>
      )}

      {!loading && searched && results.length === 0 && (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--mfg)' }}>No results found. Try a different query.</div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
            <span style={{ color: 'var(--primary)', fontSize: 15, marginTop: 1 }}>✦</span>
            <div style={{ fontSize: '13.5px', lineHeight: 1.55, color: 'var(--fg)' }}>Found {results.length} matches for your query.</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {results.map((r, i) => (
              <button key={i} onClick={() => r.path && nav(r.path)} style={{
                textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '13px 15px',
                display: 'flex', gap: 12, alignItems: 'center',
                cursor: r.path ? 'pointer' : 'default',
              }}>
                <span style={{
                  width: 38, height: 38, flexShrink: 0, borderRadius: 10,
                  background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontFamily: "'Space Grotesk'", fontWeight: 600,
                  fontSize: 16,
                }}>{r.name.charAt(0).toUpperCase()}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '14.5px', color: 'var(--fg)' }}>{r.name}</span>
                    <Badge type={r.badge} />
                    {r.score && <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--success)', whiteSpace: 'nowrap' }}>{r.score} match</span>}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--mfg)', marginTop: 2 }}>{r.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {!searched && (
        <>
          <div style={{ fontSize: '13.5px', lineHeight: 1.55, color: 'var(--mfg)', marginBottom: 16 }}>
            Search the community using semantic search and GraphRAG-powered prospect discovery.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['local grants', 'beta testers', 'Rust developers', 'coworking spaces'].map(q => (
              <button key={q} onClick={() => { setQuery(q); }} style={{
                fontFamily: "'JetBrains Mono'", fontSize: '11.5px',
                background: 'var(--muted)', border: 'none',
                borderRadius: 20, padding: '6px 13px',
                color: 'var(--mfg)', cursor: 'pointer',
              }}>{q}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
