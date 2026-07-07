import { useState } from 'react';
import { post } from '../../api';
import DataTable from '../../components/DataTable';

const EXAMPLE = `SELECT *
FROM read_parquet('s3://ainative-lakehouse/raw/business/smb_businesses/date=*/data.parquet')
WHERE city = 'Santa Cruz'
LIMIT 10`;

export default function SqlPlayground() {
  const [sql, setSql] = useState(EXAMPLE);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const data = await post('/api/data/query', { sql, max_rows: 100 });
      setResult(data);
    } catch (e) {
      setError(e.message || 'Query failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const columns = result?.columns || [];
  const rows = result?.rows || [];

  return (
    <div style={{ maxWidth: 920, padding: '26px 30px' }}>
      <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 24, letterSpacing: '-.5px', margin: '0 0 4px', color: 'var(--fg)' }}>SQL Playground</h1>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--primary)', marginBottom: 18 }}>POST /api/data/query · SELECT-only DuckDB</div>

      <div style={{
        background: 'hsl(200 20% 10%)', borderRadius: 12, overflow: 'hidden',
        border: '1px solid hsl(200 16% 18%)', marginBottom: 12,
      }}>
        <textarea
          value={sql}
          onChange={e => setSql(e.target.value)}
          spellCheck={false}
          style={{
            width: '100%', minHeight: 120, padding: '16px 18px',
            background: 'transparent', border: 'none', outline: 'none', resize: 'vertical',
            fontFamily: "'JetBrains Mono'", fontSize: 13, lineHeight: 1.6,
            color: 'hsl(191 60% 72%)', caretColor: 'var(--accent)',
          }}
          onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') run(); }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={run} disabled={loading || !sql.trim()} style={{
          fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13,
          background: 'var(--primary)', color: '#fff', border: 'none',
          padding: '8px 20px', borderRadius: 8, cursor: loading ? 'wait' : 'pointer',
          opacity: loading || !sql.trim() ? 0.6 : 1,
        }}>
          {loading ? 'Running…' : '▶ Run'}
        </button>
        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)' }}>⌘ + Enter</span>
      </div>

      {error && (
        <div style={{
          background: 'hsl(0 60% 95%)', border: '1px solid hsl(0 60% 82%)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 14,
          fontFamily: "'JetBrains Mono'", fontSize: 12, color: 'hsl(0 60% 38%)',
        }}>{error}</div>
      )}

      {result && (
        <>
          <DataTable
            columns={columns}
            gridTemplate={columns.map(() => '1fr').join(' ')}
            rows={rows.map(r => Array.isArray(r) ? r.map(v => v ?? '') : [])}
          />
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', marginTop: 10 }}>
            {result.row_count} rows · {result.execution_time_ms?.toFixed(0) || '—'} ms
          </div>
        </>
      )}
    </div>
  );
}
