import { useState, useEffect } from 'react';
import { get } from '../../api';

const TYPES = ['All', 'Theft', 'Traffic', 'Vandalism'];

export default function Safety() {
  const [data, setData] = useState(null);
  const [type, setType] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '30' });
    if (type && type !== 'All') params.set('incident_type', type);
    get(`/api/data/safety?${params}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type]);

  const incidents = data?.rows || [];
  // Resolve column positions by name so we never depend on column order.
  const col = Object.fromEntries((data?.columns || []).map((c, i) => [c, i]));

  return (
    <div style={{ maxWidth: 820, padding: '26px 30px' }}>
      <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 24, letterSpacing: '-.5px', margin: '0 0 4px', color: 'var(--fg)' }}>Safety Incidents</h1>
      {data?.description && (
        <p style={{ fontSize: 13, color: 'var(--mfg)', margin: '0 0 4px', maxWidth: 620, lineHeight: 1.5 }}>{data.description}</p>
      )}
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--primary)', marginBottom: 16 }}>GET /api/data/safety?incident_type=</div>

      <div style={{ display: 'flex', gap: 7, marginBottom: 16 }}>
        {TYPES.map(t => (
          <button key={t} onClick={() => setType(t)} style={{
            fontFamily: "'JetBrains Mono'", fontSize: 11,
            background: type === t ? 'var(--primary)' : 'var(--card)',
            color: type === t ? '#fff' : 'var(--mfg)',
            border: type === t ? 'none' : '1px solid var(--border)',
            padding: '5px 11px', borderRadius: 20, cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {incidents.map((r, i) => (
            <div key={i} style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontFamily: "'JetBrains Mono'", fontSize: '9.5px',
                  padding: '2px 7px', borderRadius: 4,
                  background: 'hsl(14 78% 57% / .14)', color: 'var(--accent)',
                }}>{r[col.type] || 'INCIDENT'}</span>
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', marginLeft: 'auto' }}>{r[col.date] || ''}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--fg)' }}>{r[col.description] || 'No description'}</div>
              {r[col.address] && <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', marginTop: 4 }}>{r[col.address]}</div>}
            </div>
          ))}
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', marginTop: 4 }}>
            Showing {data?.row_count || 0} rows · {data?.execution_time_ms?.toFixed(0) || '—'} ms
          </div>
        </div>
      )}
    </div>
  );
}
