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

  const persist = (payload) => {
    localStorage.setItem(storageKey, JSON.stringify(payload));
  };

  const login = (payload) => {
    setUser(payload.user);
    setToken(payload.token);
    persist(payload);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(storageKey);
  };

  const updateProfile = (updates) => {
    setUser((prev) => {
      const nextUser = { ...(prev || {}), ...updates };
      persist({ user: nextUser, token });
      return nextUser;
    });
  };

  const value = useMemo(
    () => ({ user, token, login, logout, updateProfile }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
