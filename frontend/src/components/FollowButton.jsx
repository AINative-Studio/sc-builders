import { useState } from 'react';
import { social } from '../api';

// The upstream signals "you're already following" as a Conflict (400 or 409),
// and "you weren't following" as 404 on unfollow. Both mean the requested state
// already holds, so we accept them rather than showing an error.
function isAlreadyInState(err, wantedFollowing) {
  if (err?.status === 409) return true;
  const conflict = err?.detail?.detail?.error === 'Conflict' || err?.detail?.error === 'Conflict';
  if (wantedFollowing && (err?.status === 400 && conflict)) return true;
  if (!wantedFollowing && err?.status === 404) return true;
  return false;
}

// Follow/unfollow toggle. `uid` is the target member's id.
// `initialFollowing` seeds state from a caller-supplied following set.
// `size` = 'sm' (member cards) | 'md' (profile header).
export default function FollowButton({ uid, initialFollowing = false, size = 'sm', onChange }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  const toggle = async (e) => {
    e?.stopPropagation();
    if (busy || !uid) return;
    const next = !following;
    setBusy(true);
    setFollowing(next); // optimistic
    try {
      if (next) await social.follow(uid);
      else await social.unfollow(uid);
      onChange?.(next);
    } catch (err) {
      // "Already in the desired state" is not a real error — the upstream returns
      // a Conflict as 400/409 for a duplicate follow, or 404 for unfollowing someone
      // you don't follow. In those cases keep the optimistic state; otherwise revert.
      if (isAlreadyInState(err, next)) {
        onChange?.(next);
      } else {
        setFollowing(!next);
      }
    } finally {
      setBusy(false);
    }
  };

  const pad = size === 'md' ? '8px 15px' : '6px 12px';
  const fontSize = size === 'md' ? '12.5px' : '11.5px';

  return (
    <button
      onClick={toggle}
      disabled={busy}
      style={{
        fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize,
        color: following ? 'var(--mfg)' : '#fff',
        background: following ? 'transparent' : 'var(--primary)',
        border: following ? '1px solid var(--border)' : 'none',
        padding: pad, borderRadius: 9,
        cursor: busy ? 'default' : 'pointer',
        opacity: busy ? 0.6 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
