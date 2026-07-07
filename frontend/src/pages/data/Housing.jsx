import { useState, useEffect, useMemo } from 'react';
import { get } from '../../api';

function spark(vals, w, h, p = 4) {
  const mn = Math.min(...vals), mx = Math.max(...vals), rng = (mx - mn) || 1;
  return vals.map((v, i) => `${(p + i / (vals.length - 1) * (w - 2 * p)).toFixed(1)},${(h - p - ((v - mn) / rng) * (h - 2 * p)).toFixed(1)}`).join(' ');
}

export default function Housing() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/api/data/housing?limit=500')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const regions = useMemo(() => {
    if (!data?.rows) return [];
    const byRegion = {};
    data.rows.forEach(r => {
      const region = r[0], zhvi = r[2];
      if (!byRegion[region]) byRegion[region] = [];
      byRegion[region].push(zhvi);
    });
    return Object.entries(byRegion).map(([region, vals]) => ({
      region,
      latest: vals[0],
      vals: vals.slice().reverse(),
    })).sort((a, b) => (b.latest || 0) - (a.latest || 0)).slice(0, 5);
  }, [data]);

  const latestVal = regions[0]?.latest;
  const chartVals = regions[0]?.vals || [];
  const hp = chartVals.length > 1 ? spark(chartVals, 640, 180, 10) : '';

  return (
    <div style={{ maxWidth: 820, padding: '26px 30px' }}>
      <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 24, letterSpacing: '-.5px', margin: '0 0 4px', color: 'var(--fg)' }}>Housing Trends</h1>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--primary)', marginBottom: 18 }}>GET /api/data/housing · Zillow Home Value Index</div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>Loading…</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 20, alignItems: 'baseline', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 34, color: 'var(--fg)', lineHeight: 1 }}>
                ${latestVal ? (latestVal / 1000).toFixed(0) + 'K' : '—'}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)' }}>
                {regions[0]?.region || 'Santa Cruz County'} ZHVI
              </div>
            </div>
          </div>

          {hp && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 13, padding: 18 }}>
              <svg viewBox="0 0 640 190" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <linearGradient id="zg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(191 84% 40%)" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="hsl(191 84% 40%)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={`10,170 ${hp} 630,170`} fill="url(#zg)" />
                <polyline points={hp} fill="none" stroke="hsl(191 84% 38%)" strokeWidth="2.5" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          <div style={{ marginTop: 16, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '10px 16px', background: 'var(--muted)', fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)' }}>
              <span>REGION</span><span>ZHVI</span><span>LATEST</span>
            </div>
            {regions.map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '11px 16px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--fg)' }}>
                <span>{r.region}</span>
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12 }}>
                  ${r.latest ? (r.latest >= 1000000 ? (r.latest / 1000000).toFixed(2) + 'M' : (r.latest / 1000).toFixed(0) + 'K') : '—'}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: 'var(--mfg)' }}>{r.vals.length} pts</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
