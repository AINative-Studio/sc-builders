import { useState, useEffect } from 'react';
import { get } from '../../api';

function spark(points, w, h, p = 4) {
  const vals = points.map(pt => pt.value);
  if (vals.length < 2) return '';
  const mn = Math.min(...vals), mx = Math.max(...vals), rng = (mx - mn) || 1;
  return vals.map((v, i) =>
    `${(p + i / (vals.length - 1) * (w - 2 * p)).toFixed(1)},${(h - p - ((v - mn) / rng) * (h - 2 * p)).toFixed(1)}`
  ).join(' ');
}

// Format a value using its unit for a clean, human presentation.
function fmtValue(v, unit) {
  if (v == null) return '—';
  if (unit === 'USD') return '$' + Math.round(v).toLocaleString();
  if (unit === '%') return v.toFixed(1) + '%';
  if (unit === 'USD/sq ft') return '$' + v.toFixed(0) + '/sq ft';
  if (unit && unit.startsWith('thousands')) return v.toLocaleString(undefined, { maximumFractionDigits: 1 }) + 'K';
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

const COLORS = ['hsl(158 52% 42%)', 'hsl(191 84% 42%)', 'hsl(14 78% 55%)', 'hsl(280 40% 55%)', 'hsl(40 70% 48%)'];

export default function Economic() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    get('/api/data/economic?limit=2000')
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const series = (data?.series || []).filter(s => s.category !== 'Other');

  // Group by category for a scannable layout.
  const byCategory = series.reduce((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: 920, padding: '26px 30px' }}>
      <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 24, letterSpacing: '-.5px', margin: '0 0 4px', color: 'var(--fg)' }}>Economic Indicators</h1>
      <p style={{ fontSize: 13, color: 'var(--mfg)', margin: '0 0 4px', maxWidth: 620, lineHeight: 1.5 }}>
        {data?.description || 'Key economic indicators for Santa Cruz County.'}
      </p>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--primary)', marginBottom: 22 }}>GET /api/data/economic · FRED &amp; Census</div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>Loading indicators…</div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>Could not load economic data.</div>
      ) : series.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>No indicators available.</div>
      ) : (
        Object.entries(byCategory).map(([category, items]) => (
          <div key={category} style={{ marginBottom: 26 }}>
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', marginBottom: 12 }}>{category.toUpperCase()}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {items.map((s, i) => (
                <div key={s.series_id} title={s.description} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 13, padding: '16px 17px' }}>
                  <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13.5, color: 'var(--fg)', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '9.5px', color: 'var(--mfg)', marginBottom: 8 }}>{s.unit || '—'}</div>
                  <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26, color: 'var(--fg)', lineHeight: 1 }}>
                    {fmtValue(s.latest, s.unit)}
                  </div>
                  {s.points && s.points.length > 1 && (
                    <svg viewBox="0 0 120 40" style={{ width: '100%', height: 32, marginTop: 10 }}>
                      <polyline points={spark([...s.points].reverse(), 120, 40)} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                  )}
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '9.5px', color: 'var(--mfg)', marginTop: 4 }}>{s.count} observations</div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
