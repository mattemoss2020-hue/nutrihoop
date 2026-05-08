import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'nutrition_jwt';
const USER_KEY  = 'nutrition_user';

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser]     = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  // Verify token on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(u => { setUser(u); localStorage.setItem(USER_KEY, JSON.stringify(u)); })
      .catch(() => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); setToken(null); setUser(null); })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al iniciar sesión');
    localStorage.setItem(TOKEN_KEY, json.token);
    localStorage.setItem(USER_KEY, JSON.stringify(json.user));
    setToken(json.token);
    setUser(json.user);
    return json.user;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const res = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al registrarse');
    localStorage.setItem(TOKEN_KEY, json.token);
    localStorage.setItem(USER_KEY, JSON.stringify(json.user));
    setToken(json.token);
    setUser(json.user);
    return json.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const authFetch = useCallback((url, opts = {}) => {
    return fetch(url, {
      ...opts,
      headers: { ...opts.headers, Authorization: `Bearer ${token}` },
    });
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
