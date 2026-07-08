import { createContext, useContext, useState, useCallback } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

// A persisted token survives a page reload, but `user` didn't — every field
// reading useAuth().user (chat sender name, TopBar, profile) went blank until
// the next interactive login(). We persist the login/register response's own
// `user` object locally so it rehydrates instantly on reload without an extra
// round-trip. (The earlier cross-tenant /auth/me identity leak that motivated
// avoiding that endpoint has since been fixed backend-side — issue #49 — but
// local rehydration is still the cheaper path.)
function loadStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(loadStoredUser);

  const login = useCallback(async (email, password) => {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    const loggedInUser = data.user || { email };
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
    setToken(data.access_token);
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthed: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
