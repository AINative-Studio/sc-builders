import { useState, useEffect, useMemo } from 'react';
import { get } from '../../api';

function spark(vals, w, h, p = 4) {
  if (vals.length < 2) return '';
  const mn = Math.min(...vals), mx = Math.max(...vals), rng = (mx - mn) || 1;
  return vals.map((v, i) => `${(p + i / (vals.length - 1) * (w - 2 * p)).toFixed(1)},${(h - p - ((v - mn) / rng) * (h - 2 * p)).toFixed(1)}`).join(' ');
}

export default function Economic() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/api/data/economic?limit=500')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const series = useMemo(() => {
    if (!data?.rows) return [];
    const bySeries = {};
    data.rows.forEach(r => {
      const id = r[0], val = r[2];
      if (!bySeries[id]) bySeries[id] = [];
      bySeries[id].push(val);
    });
    return Object.entries(bySeries).map(([id, vals]) => ({
      id,
      latest: vals[0],
      vals: vals.slice(0, 8).reverse(),
    })).slice(0, 3);
  }, [data]);

  const COLORS = ['hsl(158 52% 42%)', 'hsl(191 84% 42%)', 'hsl(14 78% 55%)'];

  return (
    <div style={{ maxWidth: 820, padding: '26px 30px' }}>
      <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 24, letterSpacing: '-.5px', margin: '0 0 4px', color: 'var(--fg)' }}>Economic Indicators</h1>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--primary)', marginBottom: 18 }}>GET /api/data/economic?series_id= · FRED</div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(series.length, 3)}, 1fr)`, gap: 14 }}>
          {series.map((s, i) => (
            <div key={s.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 13, padding: '16px 17px' }}>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '10.5px', color: 'var(--mfg)', marginBottom: 6 }}>{s.id}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26, color: 'var(--fg)' }}>{s.latest?.toLocaleString?.() || '—'}</span>
              </div>
              {s.vals.length > 1 && (
                <svg viewBox="0 0 120 40" style={{ width: '100%', height: 32, marginTop: 8 }}>
                  <polyline points={spark(s.vals, 120, 40)} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="2" strokeLinejoin="round" />
                </svg>
              )}
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '9.5px', color: 'var(--mfg)' }}>{s.vals.length} data points</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
