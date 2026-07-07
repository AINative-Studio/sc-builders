import { useState, useEffect } from 'react';
import { get } from '../../api';
import FilterChips from '../../components/FilterChips';
import DataTable from '../../components/DataTable';

const CITIES = ['All', 'Santa Cruz', 'Capitola', 'Watsonville', 'Scotts Valley'];
const CATEGORIES = ['Food', 'Tech', 'Retail'];

export default function Businesses() {
  const [data, setData] = useState(null);
  const [city, setCity] = useState('Santa Cruz');
  const [category, setCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (city && city !== 'All') params.set('city', city);
    if (category) params.set('category', category);
    if (search) params.set('q', search);
    get(`/api/data/businesses?${params}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [city, category, search]);

  const rows = data?.rows?.map(r => [r[0] || '', r[3] || '', r[5] || '', r[2] || '']) || [];

  return (
    <div style={{ maxWidth: 920, padding: '26px 30px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 24, letterSpacing: '-.5px', margin: 0, color: 'var(--fg)', whiteSpace: 'nowrap' }}>Business Directory</h1>
        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', whiteSpace: 'nowrap' }}>{data?.row_count != null ? `${data.row_count.toLocaleString()} SMBs` : 'SC County'}</span>
      </div>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--primary)', marginBottom: 16 }}>GET /api/data/businesses?q=&city=&category=</div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 9,
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '9px 12px', marginBottom: 12,
      }}>
        <span style={{ color: 'var(--mfg)' }}>⌕</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search businesses…"
          style={{ flex: 1, fontSize: '13.5px', color: 'var(--fg)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Inter' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
        {CITIES.map(c => (
          <button key={c} onClick={() => setCity(c)} style={{
            fontFamily: "'JetBrains Mono'", fontSize: 11,
            background: city === c ? 'var(--primary)' : 'var(--card)',
            color: city === c ? '#fff' : 'var(--mfg)',
            border: city === c ? 'none' : '1px solid var(--border)',
            padding: '5px 11px', borderRadius: 20, whiteSpace: 'nowrap', cursor: 'pointer',
          }}>{c}</button>
        ))}
        <span style={{ width: 1, height: 20, background: 'var(--border)', alignSelf: 'center' }} />
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(category === c ? null : c)} style={{
            fontFamily: "'JetBrains Mono'", fontSize: 11,
            background: category === c ? 'var(--primary)' : 'var(--card)',
            color: category === c ? '#fff' : 'var(--mfg)',
            border: category === c ? 'none' : '1px solid var(--border)',
            padding: '5px 11px', borderRadius: 20, whiteSpace: 'nowrap', cursor: 'pointer',
          }}>{c}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>Loading…</div>
      ) : (
        <>
          <DataTable
            columns={['NAME', 'CATEGORY', 'CITY', 'NAICS']}
            gridTemplate="2fr 1.2fr 1fr 1fr"
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
