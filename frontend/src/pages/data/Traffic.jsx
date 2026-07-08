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

  return (
    <div style={{ maxWidth: 920, padding: '26px 30px' }}>
      <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 24, letterSpacing: '-.5px', margin: '0 0 4px', color: 'var(--fg)' }}>Traffic Data</h1>
      {data?.description && (
        <p style={{ fontSize: 13, color: 'var(--mfg)', margin: '0 0 4px', maxWidth: 620, lineHeight: 1.5 }}>{data.description}</p>
      )}
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--primary)', marginBottom: 18 }}>GET /api/data/traffic · Caltrans AADT</div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>Loading…</div>
      ) : (
        <>
          <DataTable
            columns={data?.columns || []}
            fields={(data?.fields || []).filter(f => ['route', 'district', 'post_mile', 'back_aadt', 'ahead_aadt'].includes(f.key))}
            rows={data?.rows || []}
            gridTemplate="1fr 1.2fr 1fr 1.3fr 1.3fr"
          />
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', marginTop: 10 }}>
            Showing {data?.row_count || 0} rows · {data?.execution_time_ms?.toFixed(0) || '—'} ms
          </div>
        </>
      )}
    </div>
  );
}
