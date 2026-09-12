import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../hooks/useApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cgm_token');
    const stored = localStorage.getItem('cgm_user');
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (phone, password) => {
    const res = await api.post('/auth/login', { phone, password });
    localStorage.setItem('cgm_token', res.data.token);
    localStorage.setItem('cgm_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('cgm_token', res.data.token);
    localStorage.setItem('cgm_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('cgm_token');
    localStorage.removeItem('cgm_user');
    setUser(null);
  };

  const updateLanguage = (lang) => {
    const updated = { ...user, language: lang };
    localStorage.setItem('cgm_user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateLanguage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
