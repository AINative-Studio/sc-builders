import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../../api';

const DATASETS = [
  { path: 'businesses', name: 'Businesses', endpoint: 'GET /api/data/businesses', fallbackRows: '—', extra: 'SC County' },
  { path: 'housing', name: 'Housing', endpoint: 'GET /api/data/housing', fallbackRows: '—', extra: 'Zillow ZHVI' },
  { path: 'economic', name: 'Economic', endpoint: 'GET /api/data/economic', fallbackRows: '—', extra: 'FRED series' },
  { path: 'parcels', name: 'Parcels', endpoint: 'GET /api/data/parcels', fallbackRows: '—', extra: 'county data' },
  { path: 'traffic', name: 'Traffic', endpoint: 'GET /api/data/traffic', fallbackRows: '—', extra: 'Caltrans' },
  { path: 'safety', name: 'Safety', endpoint: 'GET /api/data/safety', fallbackRows: '—', extra: 'incidents' },
];

export default function DataOverview() {
  const nav = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    get('/api/data/stats')
      .then(setStats)
      .catch(() => {});
  }, []);

  function getRowCount(dataset) {
    if (!stats?.tables) return dataset.fallbackRows;
    const match = stats.tables.find(t => t.name?.toLowerCase().includes(dataset.path));
    if (match?.file_count) return match.file_count.toLocaleString();
    return dataset.fallbackRows;
  }

  return (
    <div style={{ maxWidth: 900, padding: '26px 30px' }}>
      <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px', margin: '0 0 4px', color: 'var(--fg)' }}>Data Explorer</h1>
      <p style={{ fontSize: '13.5px', color: 'var(--mfg)', margin: '0 0 8px' }}>Local Santa Cruz data from the lakehouse — query it straight into your project.</p>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', background: 'var(--muted)', display: 'inline-block', padding: '5px 10px', borderRadius: 7, marginBottom: 22 }}>
        https://sc-builders.ainative.studio/api/data
      </div>

      {stats && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)' }}>
            <b style={{ color: 'var(--fg)' }}>{stats.total_files?.toLocaleString() || '—'}</b> files
          </div>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)' }}>
            <b style={{ color: 'var(--fg)' }}>{stats.total_bytes ? `${(stats.total_bytes / 1048576).toFixed(0)} MB` : '—'}</b> total
          </div>
        </div>
      )}

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
              <span><b style={{ color: 'var(--fg)' }}>{getRowCount(d)}</b> rows</span>
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
