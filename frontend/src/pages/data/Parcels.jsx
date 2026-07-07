import { useState, useEffect } from 'react';
import { get } from '../../api';
import DataTable from '../../components/DataTable';

const CITIES = ['All', 'Santa Cruz', 'Capitola', 'Watsonville', 'Scotts Valley'];

export default function Parcels() {
  const [data, setData] = useState(null);
  const [city, setCity] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (city && city !== 'All') params.set('city', city);
    get(`/api/data/parcels?${params}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [city]);

  const rows = data?.rows?.map(r => [r[0] || '', r[1] || '', r[2] || '', r[3] || '', r[4] || '']) || [];

  return (
    <div style={{ maxWidth: 920, padding: '26px 30px' }}>
      <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 24, letterSpacing: '-.5px', margin: '0 0 4px', color: 'var(--fg)' }}>Parcels</h1>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--primary)', marginBottom: 16 }}>GET /api/data/parcels?city= · 97,338 parcels</div>

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
        {CITIES.map(c => (
          <button key={c} onClick={() => setCity(c)} style={{
            fontFamily: "'JetBrains Mono'", fontSize: 11,
            background: city === c ? 'var(--primary)' : 'var(--card)',
            color: city === c ? '#fff' : 'var(--mfg)',
            border: city === c ? 'none' : '1px solid var(--border)',
            padding: '5px 11px', borderRadius: 20, cursor: 'pointer',
          }}>{c}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>Loading…</div>
      ) : (
        <>
          <DataTable
            columns={['APN', 'ADDRESS', 'CITY', 'USE CODE', 'ACRES']}
            gridTemplate="1.2fr 2fr 1fr 1fr .8fr"
            rows={rows}
          />
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', marginTop: 10 }}>
            Showing {data?.row_count || 0} rows · {data?.execution_time_ms?.toFixed(0) || '—'} ms
          </div>
        </>
      )}
    </div>
  );
}
