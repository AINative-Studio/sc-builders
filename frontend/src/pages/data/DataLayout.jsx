import { NavLink, Outlet } from 'react-router-dom';

const DATASETS = [
  { to: '/data', label: 'Overview', icon: '▦', end: true },
  { to: '/data/businesses', label: 'Businesses', count: '290K' },
  { to: '/data/housing', label: 'Housing' },
  { to: '/data/economic', label: 'Economic' },
  { to: '/data/parcels', label: 'Parcels', count: '97K' },
  { to: '/data/traffic', label: 'Traffic' },
  { to: '/data/safety', label: 'Safety' },
];

const navStyle = ({ isActive }) => ({
  position: 'relative',
  width: '100%',
  textAlign: 'left',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '9px 12px',
  borderRadius: 8,
  fontFamily: 'Inter',
  fontSize: 13,
  color: 'var(--fg)',
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  textDecoration: 'none',
  ...(isActive ? { background: 'var(--muted)' } : {}),
});

export default function DataLayout() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', height: '100%' }}>
      <div style={{ borderRight: '1px solid var(--border)', background: 'var(--card)', overflow: 'auto', padding: '18px 12px' }}>
        <div style={{ padding: '0 8px 14px' }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 15, color: 'var(--fg)' }}>Community Data</div>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '10.5px', color: 'var(--mfg)', marginTop: 3 }}>9 endpoints · Bearer auth</div>
        </div>

        <NavLink to="/data" end style={navStyle}>
          {({ isActive }) => (
            <>
              {isActive && <span style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, background: 'var(--accent)', borderRadius: 2 }} />}
              <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)' }}>▦</span>
              <span style={{ fontWeight: 600 }}>Overview</span>
            </>
          )}
        </NavLink>

        <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '9.5px', letterSpacing: '.5px', color: 'var(--mfg)', padding: '14px 12px 6px' }}>DATASETS</div>

        {DATASETS.slice(1).map(d => (
          <NavLink key={d.to} to={d.to} style={navStyle}>
            {({ isActive }) => (
              <>
                {isActive && <span style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, background: 'var(--accent)', borderRadius: 2 }} />}
                <span>{d.label}</span>
                {d.count && <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono'", fontSize: 10, color: 'var(--mfg)' }}>{d.count}</span>}
              </>
            )}
          </NavLink>
        ))}

        <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '9.5px', letterSpacing: '.5px', color: 'var(--mfg)', padding: '14px 12px 6px' }}>TOOLS</div>
        <NavLink to="/data/sql" style={navStyle}>
          {({ isActive }) => (
            <>
              {isActive && <span style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, background: 'var(--accent)', borderRadius: 2 }} />}
              <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--primary)' }}>›_</span>
              <span>SQL Playground</span>
            </>
          )}
        </NavLink>
      </div>
      <div style={{ overflow: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
}
