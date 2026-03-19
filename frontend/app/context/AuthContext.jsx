'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined=loading, null=logged out, object=logged in
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.token) {
          setUser(parsed);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setReady(true);
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
  }, []);

  const refreshUser = useCallback(async () => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (!parsed?.token) return;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${parsed.token}` },
      });
      if (res.ok) {
        const profile = await res.json();
        const updated = { ...parsed, ...profile };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }
    } catch {
      // silent fail
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthContextProvider');
  return ctx;
}
