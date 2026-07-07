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
