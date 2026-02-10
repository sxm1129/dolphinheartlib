import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser } from '../services/api';
import { getStoredToken, setStoredToken, getMe, login as apiLogin, logoutApi } from '../services/api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  setError: (msg: string | null) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const loadUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await getMe();
      setUser(data.user);
    } catch {
      setStoredToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    try {
      const data = await apiLogin(username, password);
      setStoredToken(data.token);
      setUser(data.user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      if (msg === 'Failed to fetch' || (err instanceof TypeError && err.message?.includes('fetch'))) {
        setError('无法连接服务器，请确认后端已启动（如 uvicorn）且地址、端口正确');
      } else {
        setError(msg);
      }
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    login,
    logout,
    error,
    setError,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
