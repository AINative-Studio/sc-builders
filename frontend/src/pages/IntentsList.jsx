import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';
import { intents } from '../api';

const STATUS_COLOR = {
  matching: 'var(--accent)',
  matched: 'var(--success)',
  open: 'var(--success)',
  resolved: 'var(--mfg)',
  closed: 'var(--mfg)',
};

export default function IntentsList() {
  const nav = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    intents.list(50, 0)
      .then(res => setList(res.items || res.intents || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await intents.create({ text: text.trim(), max_matches: 5 });
      setText('');
      setComposing(false);
      if (created?.intent_id) nav(`/intents/${created.intent_id}`);
      else load();
    } catch {
      setError('Could not cast intent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const intentTitle = (it) => it.raw_text || it.text || it.title || 'Untitled intent';
  const intentId = (it) => it.intent_id || it.id;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '26px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px', margin: 0, color: 'var(--fg)', whiteSpace: 'nowrap' }}>Intents</h1>
        <button onClick={() => setComposing(c => !c)} style={{ marginLeft: 'auto', fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13, color: '#fff', background: 'var(--accent)', border: 'none', padding: '9px 16px', borderRadius: 9, cursor: 'pointer' }}>
          {composing ? 'Cancel' : '+ New intent'}
        </button>
      </div>
      <p style={{ fontSize: 13, color: 'var(--mfg)', margin: '0 0 20px' }}>Cast a goal in natural language. Agents match you to people and businesses who can help.</p>

      {composing && (
        <form onSubmit={submit} style={{ marginBottom: 24, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <textarea
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="e.g. Looking for a Rust / WASM developer to pair with this week"
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box', resize: 'vertical',
              background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
              color: 'var(--fg)', fontFamily: 'Inter', fontSize: 14, padding: '10px 12px', marginBottom: 10,
            }}
          />
          {error && <div style={{ color: 'var(--danger, #e5484d)', fontSize: 12, marginBottom: 8 }}>{error}</div>}
          <button type="submit" disabled={submitting || !text.trim()} style={{
            fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13, color: '#fff',
            background: 'var(--accent)', border: 'none', padding: '9px 18px', borderRadius: 9,
            cursor: submitting ? 'default' : 'pointer', opacity: submitting || !text.trim() ? 0.6 : 1,
          }}>{submitting ? 'Casting…' : 'Cast intent'}</button>
        </form>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>Loading intents…</div>
      ) : list.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>
          No intents yet. Cast one to get matched.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {list.map((it) => {
            const id = intentId(it);
            const status = it.status || 'open';
            const count = it.match_count ?? (it.matches?.length ?? 0);
            return (
              <button key={id} onClick={() => nav(`/intents/${id}`)} style={{
                width: '100%', textAlign: 'left',
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <Badge type="INTENT" />
                  <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: STATUS_COLOR[status] || 'var(--mfg)' }}>● {status.toUpperCase()}</span>
                </div>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '15.5px', color: 'var(--fg)' }}>{intentTitle(it)}</div>
                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '11.5px', color: 'var(--mfg)', marginTop: 4 }}>{count} match{count === 1 ? '' : 'es'}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
