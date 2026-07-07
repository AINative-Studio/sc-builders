import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../theme';
import { useAuth } from '../auth';

const NAV = [
  { icon: '✦', path: '/', title: 'Discover' },
  { icon: '☰', path: '/feed', title: 'Feed' },
  { icon: '💬', path: '/chat', title: 'Chat' },
  { icon: '◎', path: '/intents', title: 'Intents' },
  { icon: '📅', path: '/events', title: 'Events' },
  { icon: '◆', path: '/members', title: 'Members' },
  { icon: '▦', path: '/data', title: 'Community Data' },
];

export default function Rail() {
  const nav = useNavigate();
  const loc = useLocation();
  const { theme, toggle } = useTheme();
  const { logout } = useAuth();

  const isActive = (path) => {
    if (path === '/') return loc.pathname === '/';
    return loc.pathname.startsWith(path);
  };

  return (
    <div style={{
      background: 'var(--rail)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '14px 0 16px',
      gap: 5,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'var(--primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 13, color: '#fff',
        marginBottom: 10,
      }}>SC</div>

      {NAV.map(({ icon, path, title }) => (
        <button
          key={path}
          onClick={() => nav(path)}
          title={title}
          style={{
            position: 'relative',
            width: 44, height: 44,
            border: 'none',
            background: 'transparent',
            borderRadius: 12,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: path === '/members' || path === '/data' ? 16 : 17,
            color: 'var(--railfg)',
            opacity: isActive(path) ? 1 : 0.7,
          }}
        >
          {isActive(path) && (
            <>
              <span style={{ position: 'absolute', inset: 0, background: 'hsl(14 78% 57% / .2)', borderRadius: 12 }} />
              <span style={{ position: 'absolute', left: -14, top: 11, bottom: 11, width: 3, background: 'var(--accent)', borderRadius: 2 }} />
            </>
          )}
          <span style={{ position: 'relative' }}>{icon}</span>
        </button>
      ))}

      <button
        onClick={toggle}
        title="Theme"
        style={{
          marginTop: 'auto',
          width: 40, height: 40,
          border: 'none',
          background: 'transparent',
          borderRadius: 11,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
          color: 'var(--railmut)',
        }}
      >
        {theme === 'light' ? '☾' : '☀'}
      </button>
      <button
        onClick={() => nav('/profile/me')}
        title="You"
        style={{
          width: 32, height: 32,
          border: 'none',
          borderRadius: '50%',
          background: 'var(--success)',
          color: '#fff',
          fontFamily: "'Space Grotesk'",
          fontWeight: 600,
          fontSize: 12,
          cursor: 'pointer',
        }}
      >T</button>
      <button
        onClick={logout}
        title="Sign out"
        style={{
          width: 40, height: 40,
          border: 'none',
          background: 'transparent',
          borderRadius: 11,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14,
          color: 'var(--railmut)',
          marginTop: 4,
        }}
      >⏻</button>
    </div>
  );
}
