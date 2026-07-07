import { useNavigate } from 'react-router-dom';
import FilterChips from '../components/FilterChips';
import { useState } from 'react';

const INITIAL_MEMBERS = [
  { letter: 'A', bg: 'var(--accent)', name: 'ana', handle: '@ana · Rust, WASM', following: false },
  { letter: 'K', bg: 'var(--success)', name: 'kai', handle: '@kai · Systems, C++', following: true },
  { letter: 'M', bg: 'hsl(280 40% 55%)', name: 'mara', handle: '@mara · Design, DevRel', following: false },
  { letter: 'J', bg: 'hsl(40 70% 48%)', name: 'jules', handle: '@jules · Fundraising', following: false },
];

export default function Members() {
  const nav = useNavigate();
  const [filter, setFilter] = useState('all');
  const [members, setMembers] = useState(INITIAL_MEMBERS);

  function toggleFollow(index, e) {
    e.stopPropagation();
    setMembers(prev => prev.map((m, i) => i === index ? { ...m, following: !m.following } : m));
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '26px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px', margin: 0, color: 'var(--fg)', whiteSpace: 'nowrap' }}>Members</h1>
        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: 'var(--mfg)' }}>142 builders</span>
      </div>
      <FilterChips items={['all', 'rust', 'design', 'fundraising', 'hardware']} active={filter} onSelect={setFilter} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {members.map((m, i) => (
          <div key={i} onClick={() => nav(`/profile/${m.name}`)} style={{
            textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 15,
            display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer',
          }}>
            <span style={{
              width: 44, height: 44, flexShrink: 0, borderRadius: 12,
              background: m.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 17,
            }}>{m.letter}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15, color: 'var(--fg)' }}>{m.name}</div>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)' }}>{m.handle}</div>
            </div>
            <button onClick={(e) => toggleFollow(i, e)} style={{
              fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '11.5px',
              color: m.following ? 'var(--mfg)' : '#fff',
              background: m.following ? 'transparent' : 'var(--primary)',
              border: m.following ? '1px solid var(--border)' : 'none',
              padding: '6px 11px', borderRadius: 7, cursor: 'pointer',
            }}>{m.following ? 'Following' : 'Follow'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
