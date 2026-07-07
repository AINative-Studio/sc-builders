import { useNavigate } from 'react-router-dom';

const DATASETS = [
  { path: 'businesses', name: 'Businesses', endpoint: 'GET /api/data/businesses', rows: '290,412', extra: '48 MB' },
  { path: 'housing', name: 'Housing', endpoint: 'GET /api/data/housing', rows: '1,204', extra: 'Zillow ZHVI · 2015–26' },
  { path: 'economic', name: 'Economic', endpoint: 'GET /api/data/economic', rows: '3,120', extra: 'FRED series' },
  { path: 'parcels', name: 'Parcels', endpoint: 'GET /api/data/parcels', rows: '97,338', extra: '62 MB' },
  { path: 'traffic', name: 'Traffic', endpoint: 'GET /api/data/traffic', rows: '8,940', extra: 'Caltrans' },
  { path: 'safety', name: 'Safety', endpoint: 'GET /api/data/safety', rows: '42,507', extra: 'incidents' },
];

export default function DataOverview() {
  const nav = useNavigate();

  return (
    <div style={{ maxWidth: 900, padding: '26px 30px' }}>
      <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px', margin: '0 0 4px', color: 'var(--fg)' }}>Data Explorer</h1>
      <p style={{ fontSize: '13.5px', color: 'var(--mfg)', margin: '0 0 8px' }}>Local Santa Cruz data from the lakehouse — query it straight into your project.</p>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', background: 'var(--muted)', display: 'inline-block', padding: '5px 10px', borderRadius: 7, marginBottom: 22 }}>
        https://sc-builders.ainative.studio/api/data
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {DATASETS.map(d => (
          <button key={d.path} onClick={() => nav(`/data/${d.path}`)} style={{
            textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 13, padding: '16px 17px', cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15, color: 'var(--fg)' }}>{d.name}</span>
              <span style={{
                marginLeft: 'auto', fontFamily: "'JetBrains Mono'", fontSize: '9.5px',
                color: 'var(--success)', background: 'hsl(158 52% 40% / .14)',
                padding: '2px 6px', borderRadius: 4,
              }}>LIVE</span>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--primary)', marginBottom: 10 }}>{d.endpoint}</div>
            <div style={{ display: 'flex', gap: 14, fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)' }}>
              <span><b style={{ color: 'var(--fg)' }}>{d.rows}</b> rows</span>
              <span>{d.extra}</span>
            </div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 14, display: 'flex', gap: 14 }}>
        <button onClick={() => nav('/data/sql')} style={{
          flex: 1, textAlign: 'left',
          background: 'hsl(200 20% 12%)', border: 'none', borderRadius: 13,
          padding: '16px 17px', cursor: 'pointer',
        }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15, color: '#fff', marginBottom: 6 }}>›_ SQL Playground</div>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'hsl(36 8% 62%)' }}>POST /api/data/query · SELECT-only DuckDB</div>
        </button>
        <div style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 13, padding: '16px 17px' }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15, color: 'var(--fg)', marginBottom: 6 }}>Schema</div>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)' }}>GET /tables · GET /stats</div>
        </div>
      </div>
    </div>
  );
}
