import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Badge from '../components/Badge';
import { intents } from '../api';

export default function IntentDetail() {
  const nav = useNavigate();
  const { id } = useParams();
  const [intent, setIntent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busyMatch, setBusyMatch] = useState(null);

  const load = () => {
    setLoading(true);
    intents.get(id)
      .then(setIntent)
      .catch(err => { if (err?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const act = async (matchAgentId, action) => {
    if (busyMatch) return;
    setBusyMatch(matchAgentId);
    try {
      await intents.action(id, matchAgentId, action);
      load(); // refresh statuses
    } catch {
      setBusyMatch(null);
    }
  };

  if (loading) {
    return <div style={{ maxWidth: 560, margin: '0 auto', padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>Loading intent…</div>;
  }
  if (notFound || !intent) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>
        <div style={{ marginBottom: 16 }}>Intent not found.</div>
        <button onClick={() => nav('/intents')} style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '8px 15px', borderRadius: 9, cursor: 'pointer', fontFamily: "'Space Grotesk'" }}>← All intents</button>
      </div>
    );
  }

  const title = intent.raw_text || intent.text || 'Intent';
  const parsed = intent.parsed || {};
  const matches = intent.matches || [];
  const status = intent.status || 'open';
  const keywords = parsed.keywords || [];

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <button onClick={() => nav('/intents')} style={{ background: 'none', border: 'none', color: 'var(--mfg)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 14, fontFamily: 'Inter' }}>← all intents</button>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Badge type="INTENT" />
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: status === 'resolved' ? 'var(--mfg)' : 'var(--success)' }}>
              ● {status.toUpperCase()}
            </span>
          </div>
          <h2 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 22, letterSpacing: '-.3px', margin: '0 0 8px', lineHeight: 1.2, color: 'var(--fg)' }}>{title}</h2>
          <div style={{ fontSize: 13, color: 'var(--mfg)' }}>
            {parsed.category ? <>category <b style={{ color: 'var(--fg)' }}>{parsed.category}</b> · </> : null}
            urgency <b style={{ color: 'var(--fg)' }}>{parsed.urgency || 'unknown'}</b>
          </div>
          {keywords.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {keywords.map(k => (
                <span key={k} style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, background: 'var(--muted)', color: 'var(--mfg)', padding: '3px 8px', borderRadius: 6 }}>#{k}</span>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: 'var(--mfg)' }}>
            {intent.match_count ?? matches.length} match{(intent.match_count ?? matches.length) === 1 ? '' : 'es'}
          </span>
        </div>

        <div style={{ padding: '18px 24px' }}>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', marginBottom: 12 }}>MATCHES</div>
          {matches.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--mfg)' }}>
              No matches yet. Agents are still searching — check back shortly.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {matches.map((m) => {
                const mid = m.agent_id || m.id;
                const score = m.similarity_score != null ? Math.round(m.similarity_score * 100) : null;
                const done = m.status === 'accepted' || m.status === 'rejected';
                return (
                  <div key={mid} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14, color: 'var(--fg)' }}>{m.agent_name || mid}</span>
                      {score != null && <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--success)' }}>{score}% match</span>}
                      {m.status && <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)' }}>· {m.status}</span>}
                    </div>
                    {Array.isArray(m.capabilities) && m.capabilities.length > 0 && (
                      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', marginBottom: 8 }}>{m.capabilities.join(', ')}</div>
                    )}
                    {!done && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => act(mid, 'accept')} disabled={busyMatch === mid} style={{
                          fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 12, color: '#fff',
                          background: 'var(--success)', border: 'none', padding: '6px 14px', borderRadius: 8,
                          cursor: busyMatch === mid ? 'default' : 'pointer', opacity: busyMatch === mid ? 0.6 : 1,
                        }}>Accept</button>
                        <button onClick={() => act(mid, 'reject')} disabled={busyMatch === mid} style={{
                          fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 12, color: 'var(--mfg)',
                          background: 'transparent', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: 8,
                          cursor: busyMatch === mid ? 'default' : 'pointer', opacity: busyMatch === mid ? 0.6 : 1,
                        }}>Reject</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
