export default function DataTable({ columns, rows, gridTemplate }) {
  const grid = gridTemplate || columns.map(() => '1fr').join(' ');
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: grid,
        padding: '10px 16px',
        background: 'var(--muted)',
        fontFamily: "'JetBrains Mono'",
        fontSize: '10px',
        letterSpacing: '.5px',
        color: 'var(--mfg)',
      }}>
        {columns.map(col => <span key={col}>{col}</span>)}
      </div>
      {rows.map((row, i) => (
        <div key={i} style={{
          display: 'grid',
          gridTemplateColumns: grid,
          padding: '11px 16px',
          borderTop: '1px solid var(--border)',
          fontSize: '13px',
          color: 'var(--fg)',
          alignItems: 'center',
        }}>
          {row.map((cell, j) => (
            <span key={j} style={j === 0 ? { fontWeight: 500 } : { color: 'var(--mfg)' }}>{cell}</span>
          ))}
        </div>
      ))}
    </div>
  );
}
