const COLORS = {
  INTENT: 'var(--accent)',
  EVENT: 'var(--primary)',
  SERVICE: 'var(--success)',
  MATCH: 'var(--accent)',
  ANNOUNCE: 'var(--primary)',
  NODE: 'var(--success)',
  RSVP: 'var(--primary)',
  THEFT: 'hsl(40 70% 48%)',
  TRAFFIC: 'var(--primary)',
  VANDALISM: 'hsl(280 40% 55%)',
  PERSON: 'var(--accent)',
  CHANNEL: 'var(--primary)',
};

export default function Badge({ type }) {
  return (
    <span style={{
      fontFamily: "'JetBrains Mono'",
      fontSize: '9.5px',
      fontWeight: 600,
      background: COLORS[type] || 'var(--mfg)',
      color: '#fff',
      padding: '3px 7px',
      borderRadius: '5px',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      {type}
    </span>
  );
}
