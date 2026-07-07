import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Login() {
  const { login, isAuthed } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthed) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.detail?.detail || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(155deg, hsl(191 84% 22%), hsl(200 30% 14%) 55%, hsl(14 60% 30%))',
    }}>
      <div style={{
        width: 380, background: 'var(--card)', borderRadius: 18,
        padding: '34px 34px 30px',
        boxShadow: '0 24px 60px -20px rgba(0,0,0,.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 14, color: '#fff',
          }}>SC</div>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 16, color: 'var(--fg)' }}>Santa Cruz Builders</div>
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 23, letterSpacing: '-.4px', margin: '0 0 4px', color: 'var(--fg)' }}>Welcome back, builder</h1>
        <p style={{ fontSize: '13.5px', color: 'var(--mfg)', margin: '0 0 22px' }}>Sign in to your community graph.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <input
            type="email"
            placeholder="you@studio.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ fontFamily: 'Inter', fontSize: 14, padding: '11px 13px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--fg)' }}
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ fontFamily: 'Inter', fontSize: 14, padding: '11px 13px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--fg)' }}
          />
          {error && <div style={{ fontSize: 13, color: 'var(--accent)' }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{
              fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '14.5px',
              padding: 12, border: 'none', borderRadius: 10,
              background: 'var(--accent)', color: '#fff',
              cursor: loading ? 'wait' : 'pointer', marginTop: 2,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0', color: 'var(--mfg)', fontSize: 12 }}>
          <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />or<span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {['GitHub', 'LinkedIn'].map(provider => (
            <button key={provider} style={{
              flex: 1, fontFamily: 'Inter', fontWeight: 500, fontSize: 13,
              padding: 10, border: '1px solid var(--border)', borderRadius: 10,
              background: 'var(--card)', color: 'var(--fg)', cursor: 'pointer',
            }}>{provider}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
