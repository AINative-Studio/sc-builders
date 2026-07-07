export default function FilterChips({ items, active, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
      {items.map(item => (
        <button
          key={item}
          onClick={() => onSelect(item)}
          style={{
            fontFamily: "'JetBrains Mono'",
            fontSize: '11px',
            background: active === item ? 'var(--primary)' : 'var(--card)',
            color: active === item ? '#fff' : 'var(--mfg)',
            border: active === item ? 'none' : '1px solid var(--border)',
            padding: '5px 11px',
            borderRadius: 20,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
