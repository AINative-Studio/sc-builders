import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterChips from '../components/FilterChips';
import { get } from '../api';

const AVATAR_COLORS = [
  'var(--accent)', 'var(--success)', 'hsl(280 40% 55%)',
  'hsl(40 70% 48%)', 'var(--primary)', 'hsl(340 60% 50%)',
];

export default function Members() {
  const nav = useNavigate();
  const [filter, setFilter] = useState('all');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ limit: '50' });
    if (filter && filter !== 'all') params.set('skill', filter);
    setLoading(true);
    get(`/api/members?${params}`)
      .then(res => setMembers(res.items || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '26px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px', margin: 0, color: 'var(--fg)', whiteSpace: 'nowrap' }}>Members</h1>
        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: 'var(--mfg)' }}>{members.length} builders</span>
      </div>
      <FilterChips items={['all', 'rust', 'design', 'fundraising', 'hardware']} active={filter} onSelect={setFilter} />

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>Loading...</div>
      ) : members.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>No members found</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {members.map((m, i) => {
            const name = m.display_name || m.name || m.handle || '';
            const handle = m.handle || m.display_name || '';
            const skills = m.skills || '';
            const letter = name.charAt(0).toUpperCase() || '?';
            const id = m.id || m._id || m.user_id || name;
            return (
              <div key={id} onClick={() => nav(`/profile/${handle || name}`)} style={{
                textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 15,
                display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer',
              }}>
                <span style={{
                  width: 44, height: 44, flexShrink: 0, borderRadius: 12,
                  background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 17,
                }}>{letter}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15, color: 'var(--fg)' }}>{name}</div>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--mfg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    @{handle}{skills ? ` · ${skills}` : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
