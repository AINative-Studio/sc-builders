const BASE = import.meta.env.VITE_API_URL || '';

export async function api(path, opts = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...opts.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    const err = new Error(`${res.status} ${res.statusText}`);
    err.status = res.status;
    try { err.detail = await res.json(); } catch {}
    throw err;
  }
  return res.json();
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

// Intent casting — /api/intents/* (proxies AINative platform intent-casting API)
export const intents = {
  create: (body) => post('/api/intents', body),
  list: (limit = 20, skip = 0) => get(`/api/intents?limit=${limit}&skip=${skip}`),
  get: (id) => get(`/api/intents/${id}`),
  action: (id, matchAgentId, action, message) =>
    post(`/api/intents/${id}/action/${matchAgentId}`, { action, ...(message ? { message } : {}) }),
};
