import { useState, useEffect } from 'react';
import { get } from '../../api';
import DataTable from '../../components/DataTable';

export default function Traffic() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/api/data/traffic?limit=50')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const rows = data?.rows?.map(r => [r[0] || '', r[1] || '', r[2] || '', r[3] || '']) || [];

  return (
    <div style={{ maxWidth: 920, padding: '26px 30px' }}>
      <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 24, letterSpacing: '-.5px', margin: '0 0 4px', color: 'var(--fg)' }}>Traffic Data</h1>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--primary)', marginBottom: 18 }}>GET /api/data/traffic · Caltrans · 8,940 records</div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>Loading…</div>
      ) : (
        <>
          <DataTable
            columns={['ROUTE', 'LOCATION', 'AADT', 'YEAR']}
            gridTemplate="1fr 2.5fr 1fr .8fr"
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
