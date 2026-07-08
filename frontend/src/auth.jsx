import { createContext, useContext, useState, useCallback } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

// A persisted token survives a page reload, but `user` didn't — every field
// reading useAuth().user (chat sender name, TopBar, profile) went blank until
// the next interactive login(). Rehydrating from GET /api/auth/me would be
// the obvious fix, but that endpoint has a confirmed cross-tenant identity
// leak (returns the project owner's real profile regardless of whose token
// is presented — see BUG_AUTH_ME_IDENTITY_LEAK.md) — so we persist the
// login/register response's own `user` object locally instead.
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
    setToken(data.access_token);
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
