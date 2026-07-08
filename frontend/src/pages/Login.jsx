import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { post } from '../api';

export default function Login() {
  const { login, isAuthed } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // A reset token in the URL (?reset_token=…) opens the set-new-password view.
  const resetToken = new URLSearchParams(window.location.search).get('reset_token');
  const [mode, setMode] = useState(resetToken ? 'reset' : 'login'); // login | forgot | reset
  const [notice, setNotice] = useState('');
  const [newPassword, setNewPassword] = useState('');

  if (isAuthed) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      const d = err.detail?.detail;
      const msg = typeof d === 'string' ? d : d?.detail || err.message || 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError(''); setNotice(''); setLoading(true);
    try {
      const res = await post('/api/auth/forgot-password', { email });
      setNotice(res?.message || 'If that email exists, a reset link has been sent.');
    } catch {
      setNotice('If that email exists, a reset link has been sent.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(''); setNotice(''); setLoading(true);
    try {
      await post('/api/auth/reset-password', { token: resetToken, new_password: newPassword });
      setNotice('Password reset. You can now sign in.');
      setMode('login');
    } catch (err) {
      const d = err.detail?.detail;
      setError((typeof d === 'string' ? d : d?.detail) || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { fontFamily: 'Inter', fontSize: 14, padding: '11px 13px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--fg)' };
  const btnStyle = { fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '14.5px', padding: 12, border: 'none', borderRadius: 10, background: 'var(--accent)', color: '#fff', cursor: loading ? 'wait' : 'pointer', marginTop: 2, opacity: loading ? 0.7 : 1 };
  const linkStyle = { background: 'none', border: 'none', color: 'var(--primary)', fontFamily: 'Inter', fontSize: 12.5, cursor: 'pointer', padding: 0 };

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
        <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 23, letterSpacing: '-.4px', margin: '0 0 4px', color: 'var(--fg)' }}>
          {mode === 'login' ? 'Welcome back, builder' : mode === 'forgot' ? 'Reset your password' : 'Set a new password'}
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--mfg)', margin: '0 0 22px' }}>
          {mode === 'login' ? 'Sign in to your community graph.'
            : mode === 'forgot' ? "Enter your email and we'll send a reset link."
            : 'Choose a new password for your account.'}
        </p>

        {notice && <div style={{ fontSize: 13, color: 'var(--success)', marginBottom: 12 }}>{notice}</div>}

        {mode === 'login' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <input type="email" placeholder="you@studio.com" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            <input type="password" placeholder="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
            {error && <div style={{ fontSize: 13, color: 'var(--accent)' }}>{error}</div>}
            <button type="submit" disabled={loading} style={btnStyle}>{loading ? 'Signing in…' : 'Sign in'}</button>
            <button type="button" onClick={() => { setMode('forgot'); setError(''); setNotice(''); }} style={{ ...linkStyle, alignSelf: 'flex-start', marginTop: 4 }}>Forgot password?</button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <input type="email" placeholder="you@studio.com" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            {error && <div style={{ fontSize: 13, color: 'var(--accent)' }}>{error}</div>}
            <button type="submit" disabled={loading} style={btnStyle}>{loading ? 'Sending…' : 'Send reset link'}</button>
            <button type="button" onClick={() => { setMode('login'); setError(''); setNotice(''); }} style={{ ...linkStyle, alignSelf: 'flex-start', marginTop: 4 }}>← Back to sign in</button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <input type="password" placeholder="new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} style={inputStyle} />
            {error && <div style={{ fontSize: 13, color: 'var(--accent)' }}>{error}</div>}
            <button type="submit" disabled={loading} style={btnStyle}>{loading ? 'Resetting…' : 'Reset password'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
