import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext();

const TOKEN_KEY = 'netguard_token';
const USER_KEY = 'netguard_user';

const safeJson = async (res) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('JSON Parse Error. Data received:', text.substring(0, 100));
    throw new Error(`Serverdan noto'g'ri javob keldi (JSON emas). Status: ${res.status}`);
  }
};

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  /** Restore session from localStorage on app start */
  const checkUserAuth = useCallback(async (isSilent = false) => {
    // Only show global loading if we don't have a session yet or NOT in silent mode
    if (!isSilent && !isAuthenticated) {
      setIsLoadingAuth(true);
    }
    
    const token = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);

    if (!token || !savedUser) {
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      setAuthError({ type: 'auth_required', message: 'Authentication required' });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Session expired');

      const currentUser = await safeJson(res);
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (err) {
      console.warn('Session invalid, logging out:', err.message);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required', message: err.message });
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkUserAuth();
  }, [checkUserAuth]);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await safeJson(res).catch(() => ({ error: 'Login relay error' }));
      throw new Error(err.error || 'Login failed');
    }

    const data = await safeJson(res);
    const { token, user: loggedInUser } = data;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setIsAuthenticated(true);
    setAuthError(null);
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setIsAuthenticated(false);
    setAuthError({ type: 'auth_required', message: 'Logged out' });
  }, []);

  const register = useCallback(async (email, password, name, role) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role }),
    });

    if (!res.ok) {
      const err = await safeJson(res).catch(() => ({ error: 'Registration error' }));
      throw new Error(err.error || 'Registration failed');
    }

    const data = await safeJson(res);
    const { token, id, role: userRole, name: userName } = data;
    const loggedInUser = { id, email, role: userRole, name: userName };
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setIsAuthenticated(true);
    setAuthError(null);
  }, []);

  const navigateToLogin = useCallback(() => {
    setAuthError({ type: 'auth_required', message: 'Please log in' });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings: null,
      login,
      register,
      logout,
      navigateToLogin,
      checkAppState: checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
