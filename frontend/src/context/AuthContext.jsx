import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext();

const storageKey = 'ccd-auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        setToken(parsed.token);
      } catch (error) {
        console.error('Failed to parse auth storage', error);
        localStorage.removeItem(storageKey);
      }
    }
  }, []);

  const login = (payload) => {
    setUser(payload.user);
    setToken(payload.token);
    localStorage.setItem(storageKey, JSON.stringify(payload));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(storageKey);
  };

  const value = useMemo(() => ({ user, token, login, logout }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
