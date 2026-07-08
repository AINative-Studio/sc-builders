import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { get, social, profile as profileApi } from '../api';
import FollowButton from '../components/FollowButton';

export default function Profile() {
  const nav = useNavigate();
  const { handle } = useParams(); // route param carries the member's user_id
  const uid = handle;

  const [agentView, setAgentView] = useState(false);
  const [member, setMember] = useState(null); // AINative profile (source of truth)
  const [skills, setSkills] = useState([]);   // SC-specific, from member_directory
  const [stats, setStats] = useState(null);
  const [initialFollowing, setInitialFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [action, setAction] = useState(null); // transient status message
  const [meId, setMeId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const isSelf = meId && meId === uid;

  useEffect(() => {
    let live = true;
    setLoading(true);
    setNotFound(false);
    setEditing(false);
    (async () => {
      // Resolve who I am first (AINative profile) so we know if this is self.
      let myId = null;
      try {
        const meProf = await profileApi.me();
        myId = meProf?.id;
        if (live) setMeId(myId);
      } catch { /* not fatal */ }

      // Load the target profile. If it's me, /me returns the freshest copy.
      try {
        const p = (myId && myId === uid) ? await profileApi.me() : await profileApi.byId(uid);
        if (!live) return;
        setMember(p);
        setStats({
          followers: p.followers_count ?? 0,
          following: p.following_count ?? 0,
          friends: p.friends_count ?? 0,
        });
      } catch (err) {
        if (live && (err?.status === 404)) setNotFound(true);
      } finally {
        if (live) setLoading(false);
      }

      // SC-specific skills from the member_directory (best-effort supplement).
      try {
        const m = await get(`/api/members/${uid}`);
        const sk = m?.row_data?.skills || m?.skills;
        if (live && Array.isArray(sk)) setSkills(sk);
      } catch { /* non-critical */ }

      // Seed the follow button.
      try {
        if (myId && live) {
          const mine = await social.following(myId).catch(() => null);
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

  const startEdit = () => {
    setForm({
      location: member.location || '',
      website: member.website || '',
      ask_me_anything: member.ask_me_anything || '',
    });
    setEditing(true);
  };

  const saveProfile = async () => {
    if (saving) return;
    setSaving(true);
    // Only fields the platform profile PATCH accepts today (bio/avatar/social
    // are broken upstream — see #50).
    const payload = {
      location: form.location.trim() || null,
      website: form.website.trim() || null,
      ask_me_anything: form.ask_me_anything.trim() || null,
    };
    try {
      await profileApi.update(payload);
      // Upstream write is eventually consistent; reflect locally now, refetch soon.
      setMember(m => ({ ...m, ...payload }));
      setEditing(false);
      flash('Profile saved');
      setTimeout(() => { profileApi.me().then(setMember).catch(() => {}); }, 1500);
    } catch {
      flash('Could not save profile');
    } finally {
      setSaving(false);
    }
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

  const name = member.full_name || member.username || member.name || 'Member';
  const letter = name.charAt(0).toUpperCase() || '?';
  const metaLine = [member.username && `@${member.username}`, member.location].filter(Boolean).join(' · ') || 'Santa Cruz';
  const agentJson = JSON.stringify({
    user_id: member.id || uid,
    full_name: name,
    username: member.username || null,
    location: member.location || null,
    website: member.website || null,
    skills,
    followers: member.followers_count ?? 0,
    following: member.following_count ?? 0,
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
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: 'var(--mfg)' }}>{metaLine}</div>
            {member.website && (
              <a href={member.website} target="_blank" rel="noreferrer" style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: 'var(--primary)', textDecoration: 'none' }}>{member.website.replace(/^https?:\/\//, '')}</a>
            )}
            <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12, color: 'var(--mfg)' }}>
              <span><b style={{ color: 'var(--fg)', fontFamily: "'Space Grotesk'" }}>{stats?.following ?? '—'}</b> following</span>
              <span><b style={{ color: 'var(--fg)', fontFamily: "'Space Grotesk'" }}>{stats?.followers ?? '—'}</b> followers</span>
              {stats?.friends != null && <span><b style={{ color: 'var(--fg)', fontFamily: "'Space Grotesk'" }}>{stats.friends}</b> friends</span>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'stretch' }}>
            {isSelf ? (
              <button onClick={editing ? () => setEditing(false) : startEdit} style={{
                fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '12.5px',
                color: 'var(--fg)', background: 'var(--card)', border: '1px solid var(--border)',
                padding: '8px 15px', borderRadius: 9, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>{editing ? 'Cancel' : 'Edit profile'}</button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        {editing && form && (
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <label style={{ flex: 1, fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)' }}>LOCATION
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Santa Cruz, CA"
                  style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--fg)', fontFamily: 'Inter', fontSize: 14, padding: '9px 11px' }} />
              </label>
              <label style={{ flex: 1, fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)' }}>WEBSITE
                <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://…"
                  style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--fg)', fontFamily: 'Inter', fontSize: 14, padding: '9px 11px' }} />
              </label>
            </div>
            <label style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)' }}>ASK ME ANYTHING
              <textarea value={form.ask_me_anything} onChange={e => setForm(f => ({ ...f, ask_me_anything: e.target.value }))} placeholder="Topics you can help others with…" rows={2}
                style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, resize: 'vertical', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--fg)', fontFamily: 'Inter', fontSize: 14, padding: '9px 11px' }} />
            </label>
            <button onClick={saveProfile} disabled={saving} style={{
              alignSelf: 'flex-start', fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13, color: '#fff',
              background: 'var(--accent)', border: 'none', padding: '9px 18px', borderRadius: 9,
              cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1,
            }}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        )}

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
            {member.ask_me_anything && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: '.5px', color: 'var(--mfg)', marginBottom: 6 }}>ASK ME ANYTHING</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg)' }}>{member.ask_me_anything}</div>
              </div>
            )}
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
