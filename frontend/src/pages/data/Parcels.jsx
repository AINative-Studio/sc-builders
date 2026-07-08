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

  return (
    <div style={{ maxWidth: 920, padding: '26px 30px' }}>
      <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 24, letterSpacing: '-.5px', margin: '0 0 4px', color: 'var(--fg)' }}>Parcels</h1>
      {data?.description && (
        <p style={{ fontSize: 13, color: 'var(--mfg)', margin: '0 0 4px', maxWidth: 620, lineHeight: 1.5 }}>{data.description}</p>
      )}
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--primary)', marginBottom: 16 }}>GET /api/data/parcels?city=</div>

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
            columns={data?.columns || []}
            fields={(data?.fields || []).filter(f => ['apn', 'address', 'city', 'use_description', 'zoning'].includes(f.key))}
            rows={data?.rows || []}
            gridTemplate="1.2fr 2fr 1fr 1.3fr 1fr"
          />
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', marginTop: 10 }}>
            Showing {data?.row_count || 0} rows · {data?.execution_time_ms?.toFixed(0) || '—'} ms
          </div>
        </>
      )}
    </div>
  );
}
