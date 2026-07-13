const BASE = import.meta.env.VITE_API_URL || '';

// Single-flight refresh: if several requests 401 at once, they share one
// refresh call rather than each firing their own.
let refreshInFlight = null;

async function refreshAccessToken() {
  const refresh_token = localStorage.getItem('refresh_token');
  if (!refresh_token) return null;
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    })
      .then(async (r) => {
        if (!r.ok) return null;
        const data = await r.json();
        if (data.access_token) localStorage.setItem('token', data.access_token);
        if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
        return data.access_token || null;
      })
      .catch(() => null)
      .finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

export async function api(path, opts = {}, _retried = false) {
  const token = localStorage.getItem('token');
  const headers = { ...opts.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let body = opts.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, { ...opts, headers, body });
  if (!res.ok) {
    // On 401, try a one-time refresh + retry (but never for the refresh call itself).
    if (res.status === 401 && !_retried && !path.includes('/api/auth/refresh')) {
      const newToken = await refreshAccessToken();
      if (newToken) return api(path, opts, true);
      // Refresh unavailable/failed and we do have a (stale) token: the session
      // has expired. Clear it and send the user to login instead of surfacing
      // a wall of 401s that leave the page half-broken.
      if (token) handleSessionExpired();
    }
    const err = new Error(`${res.status} ${res.statusText}`);
    err.status = res.status;
    try { err.detail = await res.json(); } catch {}
    throw err;
  }
  return res.json();
}

function handleSessionExpired() {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/login')) {
    window.location.assign('/login');
  }
}

export const get = (path) => api(path);
export const post = (path, body) => api(path, { method: 'POST', body });
export const patch = (path, body) => api(path, { method: 'PATCH', body });
export const del = (path) => api(path, { method: 'DELETE' });

// Social graph — /api/social/*
export const social = {
  follow: (uid) => post(`/api/social/follow/${uid}`),
  unfollow: (uid) => del(`/api/social/follow/${uid}`),
  sendFriendRequest: (uid) => post(`/api/social/friend-request/${uid}`),
  acceptFriend: (reqId) => post(`/api/social/friend-request/${reqId}/accept`),
  declineFriend: (reqId) => post(`/api/social/friend-request/${reqId}/decline`),
  cancelFriendRequest: (reqId) => del(`/api/social/friend-request/${reqId}`),
  block: (uid) => post(`/api/social/block/${uid}`),
  ignore: (uid) => post(`/api/social/ignore/${uid}`),
  followers: (uid) => get(`/api/social/${uid}/followers`),
  following: (uid) => get(`/api/social/${uid}/following`),
  friends: (uid) => get(`/api/social/${uid}/friends`),
  myFriendRequests: () => get('/api/social/me/friend-requests'),
  myStats: () => get('/api/social/me/stats'),
};

// User profile — /api/profile/* (proxies AINative platform profile)
export const profile = {
  me: () => get('/api/profile/me'),
  update: (body) => patch('/api/profile/me', body),
  byId: (id) => get(`/api/profile/${id}`),
};

// Intent casting — /api/intents/* (proxies AINative platform intent-casting API)
export const intents = {
  create: (body) => post('/api/intents', body),
  list: (limit = 20, skip = 0) => get(`/api/intents?limit=${limit}&skip=${skip}`),
  get: (id) => get(`/api/intents/${id}`),
  action: (id, matchAgentId, action, message) =>
    post(`/api/intents/${id}/action/${matchAgentId}`, { action, ...(message ? { message } : {}) }),
};

// Comments — /api/comments/* (proxies AINative platform comments API).
// content_type is one of: channel | event | announcement.
export const comments = {
  list: (contentType, contentId) => get(`/api/comments/${contentType}/${contentId}`),
  create: (contentType, contentId, content) =>
    post('/api/comments', { content, content_type: contentType, content_id: String(contentId) }),
  remove: (commentId) => del(`/api/comments/${commentId}`),
};
