// Format a cell value using its column's unit metadata.
function fmtCell(value, field) {
  if (value == null || value === '') return '—';
  const unit = field?.unit;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    if (unit === 'USD') return '$' + Math.round(value).toLocaleString();
    if (unit === 'vehicles/day') return value.toLocaleString() + '/day';
    return value.toLocaleString();
  }
  return String(value);
}

// Renders a lakehouse response ({columns, rows, fields}) as a clean table with
// human column headers + unit-aware value formatting. Falls back gracefully if
// `fields` metadata is absent.
export default function DataTable({ columns = [], rows = [], fields, gridTemplate, maxColumns }) {
  const meta = fields && fields.length ? fields : columns.map(c => ({ key: c, label: c }));
  const shown = maxColumns ? meta.slice(0, maxColumns) : meta;
  const keyToIndex = Object.fromEntries(columns.map((c, i) => [c, i]));
  const grid = gridTemplate || shown.map((_, i) => (i === 0 ? '2fr' : '1fr')).join(' ');

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: grid,
        padding: '10px 16px', background: 'var(--muted)',
        fontFamily: "'JetBrains Mono'", fontSize: '10px', letterSpacing: '.5px', color: 'var(--mfg)',
      }}>
        {shown.map(f => (
          <span key={f.key} title={f.description || ''}>
            {f.label}{f.unit ? ` (${f.unit})` : ''}
          </span>
        ))}
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: '20px 16px', color: 'var(--mfg)', fontSize: 13, textAlign: 'center' }}>No rows.</div>
      ) : (
        rows.map((row, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: grid,
            padding: '11px 16px', borderTop: '1px solid var(--border)',
            fontSize: '13px', color: 'var(--fg)', alignItems: 'center',
          }}>
            {shown.map((f, j) => {
              const idx = keyToIndex[f.key];
              const value = Array.isArray(row) ? row[idx] : row[f.key];
              return (
                <span key={f.key} style={j === 0 ? { fontWeight: 500 } : { color: 'var(--mfg)' }}>
                  {fmtCell(value, f)}
                </span>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
