import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { get, social } from '../api';
import FollowButton from '../components/FollowButton';

export default function Profile() {
  const nav = useNavigate();
  const { handle } = useParams(); // route param carries the member's user_id
  const uid = handle;

  const [agentView, setAgentView] = useState(false);
  const [member, setMember] = useState(null);
  const [stats, setStats] = useState(null);
  const [initialFollowing, setInitialFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [action, setAction] = useState(null); // transient status message

  useEffect(() => {
    let live = true;
    setLoading(true);
    setNotFound(false);
    (async () => {
      try {
        const m = await get(`/api/members/${uid}`);
        if (!live) return;
        setMember(m.row_data ? { ...m.row_data, ...m } : m);
      } catch (err) {
        if (live && err?.status === 404) setNotFound(true);
      } finally {
        if (live) setLoading(false);
      }
      // Social data is best-effort; failures shouldn't block the profile.
      try {
        const [followers, following] = await Promise.all([
          social.followers(uid).catch(() => null),
          social.following(uid).catch(() => null),
        ]);
        if (!live) return;
        setStats({
          followers: followers?.total ?? (followers?.followers?.length ?? 0),
          following: following?.total ?? (following?.following?.length ?? 0),
        });
      } catch { /* non-critical */ }

      // Seed the follow button: am I already following this person?
      try {
        const meRes = await get('/api/members/me');
        const meId = meRes?.row_data?.user_id || meRes?.user_id || meRes?.id;
        if (meId && live) {
          const mine = await social.following(meId).catch(() => null);
          const list = mine?.following || mine?.items || [];
          setInitialFollowing(list.some(f => (f.user_id || f.id || f.uid) === uid));
        }
      } catch { /* non-critical */ }
    })();
    return () => { live = false; };
  }, [uid]);

  const flash = (msg) => { setAction(msg); setTimeout(() => setAction(null), 2500); };

  const onFriendRequest = async () => {
    try { await social.sendFriendRequest(uid); flash('Friend request sent'); }
    catch (err) { flash(err?.status === 409 ? 'Request already pending' : 'Could not send request'); }
  };
  const onBlock = async () => {
    if (!window.confirm('Block this member? They will no longer be able to interact with you.')) return;
    try { await social.block(uid); flash('Member blocked'); }
    catch { flash('Could not block'); }
  };

  const tabStyle = (active) => ({
    fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '11.5px',
    padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
    background: active ? 'var(--card)' : 'transparent',
    color: active ? 'var(--fg)' : 'var(--mfg)',
  });

  if (loading) {
    return <div style={{ maxWidth: 600, margin: '0 auto', padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>Loading profile…</div>;
  }
  if (notFound || !member) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 40, textAlign: 'center', color: 'var(--mfg)' }}>
        <div style={{ marginBottom: 16 }}>Member not found.</div>
        <button onClick={() => nav('/members')} style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '8px 15px', borderRadius: 9, cursor: 'pointer', fontFamily: "'Space Grotesk'" }}>← Back to directory</button>
      </div>
    );
  }

  const name = member.display_name || member.name || member.handle || 'Member';
  const skills = Array.isArray(member.skills) ? member.skills : [];
  const letter = name.charAt(0).toUpperCase() || '?';
  const agentJson = JSON.stringify({
    user_id: member.user_id || uid,
    display_name: name,
    skills,
    availability: member.availability || 'unknown',
    github: member.github || null,
    contactable_by_agents: true,
  }, null, 2);

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
          }}>{letter}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 20, color: 'var(--fg)' }}>{name}</div>
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: 'var(--mfg)' }}>{member.availability || 'Santa Cruz'}</div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12, color: 'var(--mfg)' }}>
              <span><b style={{ color: 'var(--fg)', fontFamily: "'Space Grotesk'" }}>{stats?.following ?? '—'}</b> following</span>
              <span><b style={{ color: 'var(--fg)', fontFamily: "'Space Grotesk'" }}>{stats?.followers ?? '—'}</b> followers</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'stretch' }}>
            <FollowButton uid={uid} initialFollowing={initialFollowing} size="md" />
            <button onClick={onFriendRequest} style={{
              fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '11.5px',
              color: 'var(--fg)', background: 'transparent', border: '1px solid var(--border)',
              padding: '6px 12px', borderRadius: 9, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>+ Friend</button>
            <button onClick={onBlock} style={{
              fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '11.5px',
              color: 'var(--mfg)', background: 'transparent', border: '1px solid var(--border)',
              padding: '6px 12px', borderRadius: 9, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>Block</button>
          </div>
        </div>

        {action && (
          <div style={{ padding: '8px 24px', background: 'var(--muted)', borderBottom: '1px solid var(--border)', fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--success)' }}>{action}</div>
        )}

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
            {skills.length ? (
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {skills.map(s => (
                  <span key={s} style={{
                    fontFamily: "'JetBrains Mono'", fontSize: 12,
                    background: 'hsl(14 78% 57% / .12)', color: 'var(--accent)',
                    padding: '5px 11px', borderRadius: 20, whiteSpace: 'nowrap',
                  }}>{s}</span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--mfg)' }}>No skills listed yet.</div>
            )}
          </div>
        ) : (
          <div style={{ padding: '20px 24px', background: 'hsl(200 20% 12%)' }}>
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '1px', color: 'hsl(36 8% 55%)', marginBottom: 12 }}>AGENT-READABLE PROFILE</div>
            <pre style={{
              margin: 0, fontFamily: "'JetBrains Mono'", fontSize: '11.5px',
              lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'hsl(36 20% 90%)',
            }}>{agentJson}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
