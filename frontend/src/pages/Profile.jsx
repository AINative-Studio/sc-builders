import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AGENT_JSON = `{
  "handle": "@ana",
  "type": "person",
  "skills": ["rust", "wasm"],
  "offers": ["pairing", "code-review"],
  "open_intents": 1,
  "availability": "2026-W28",
  "contactable_by_agents": true
}`;

export default function Profile() {
  const nav = useNavigate();
  const [agentView, setAgentView] = useState(false);
  const [following, setFollowing] = useState(false);

  const tabStyle = (active) => ({
    fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '11.5px',
    padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
    background: active ? 'var(--card)' : 'transparent',
    color: active ? 'var(--fg)' : 'var(--mfg)',
  });

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <button onClick={() => nav('/members')} style={{ background: 'none', border: 'none', color: 'var(--mfg)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 14, fontFamily: 'Inter' }}>← directory</button>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '22px 24px', display: 'flex', gap: 16, alignItems: 'flex-start', borderBottom: '1px solid var(--border)' }}>
          <span style={{
            width: 60, height: 60, flexShrink: 0, borderRadius: 16,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 24,
          }}>A</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 20, color: 'var(--fg)' }}>ana</div>
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: 'var(--mfg)' }}>@ana · she/her · Santa Cruz</div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12, color: 'var(--mfg)' }}>
              <span><b style={{ color: 'var(--fg)', fontFamily: "'Space Grotesk'" }}>128</b> following</span>
              <span><b style={{ color: 'var(--fg)', fontFamily: "'Space Grotesk'" }}>94</b> followers</span>
              <span><b style={{ color: 'var(--fg)', fontFamily: "'Space Grotesk'" }}>3</b> intents</span>
            </div>
          </div>
          <button onClick={() => setFollowing(f => !f)} style={{
            fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '12.5px',
            color: following ? 'var(--mfg)' : '#fff',
            background: following ? 'transparent' : 'var(--primary)',
            border: following ? '1px solid var(--border)' : 'none',
            padding: '8px 15px', borderRadius: 9, cursor: 'pointer',
          }}>{following ? 'Following' : 'Follow'}</button>
        </div>

        <div style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)' }}>VIEW</span>
          <div style={{ display: 'flex', background: 'var(--muted)', borderRadius: 8, padding: 3 }}>
            <button onClick={() => setAgentView(false)} style={tabStyle(!agentView)}>Human</button>
            <button onClick={() => setAgentView(true)} style={tabStyle(agentView)}>Agent-readable</button>
          </div>
        </div>

        {!agentView ? (
          <div style={{ padding: '20px 24px' }}>
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', marginBottom: 9 }}>SKILLS</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 20 }}>
              {['rust', 'wasm', 'distributed systems'].map(s => (
                <span key={s} style={{
                  fontFamily: "'JetBrains Mono'", fontSize: 12,
                  background: 'hsl(14 78% 57% / .12)', color: 'var(--accent)',
                  padding: '5px 11px', borderRadius: 20, whiteSpace: 'nowrap',
                }}>{s}</span>
              ))}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', marginBottom: 9 }}>OPEN INTENTS</div>
            <button onClick={() => nav('/intents/1')} style={{
              width: '100%', textAlign: 'left',
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '11px 13px', cursor: 'pointer',
            }}>
              <div style={{ fontSize: '13.5px', color: 'var(--fg)' }}><b>Pair on WASM</b> this week · offers Rust</div>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--success)', marginTop: 2 }}>● open · 3 matches</div>
            </button>
          </div>
        ) : (
          <div style={{ padding: '20px 24px', background: 'hsl(200 20% 12%)' }}>
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '1px', color: 'hsl(36 8% 55%)', marginBottom: 12 }}>AGENT-READABLE PROFILE</div>
            <pre style={{
              margin: 0, fontFamily: "'JetBrains Mono'", fontSize: '11.5px',
              lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'hsl(36 20% 90%)',
            }}>{AGENT_JSON}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
