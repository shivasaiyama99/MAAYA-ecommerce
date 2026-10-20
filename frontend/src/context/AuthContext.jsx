import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    // Check sessionStorage first (used for admin / ephemeral sessions), then localStorage
    return sessionStorage.getItem('token') || localStorage.getItem('token');
  });
  const [loading, setLoading] = useState(true);

  // Validate session on mount with /api/auth/me
  useEffect(() => {
    const initAuth = async () => {
      const activeToken = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!activeToken) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getMe();
        if (response.success && response.data?.user) {
          setUser(response.data.user);
          setToken(activeToken);
          try {
            if (sessionStorage.getItem('token')) {
              sessionStorage.setItem('user', JSON.stringify(response.data.user));
            } else {
              localStorage.setItem('user', JSON.stringify(response.data.user));
            }
          } catch {
            // Ignore non-fatal storage errors
          }
        } else {
          throw new Error('Invalid session');
        }
      } catch (err) {
        // Token is expired, invalid, or user was deleted
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData, authToken, isAdmin = false) => {
    if (isAdmin) {
      // Secure admin session in sessionStorage only (ephemeral session, cleared on tab close)
      // Never store admin session or any credentials in localStorage
      sessionStorage.setItem('token', authToken);
      sessionStorage.setItem('user', JSON.stringify(userData));
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } else {
      // Standard customer session
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }

    setUser(userData);
    setToken(authToken);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Ignore network errors
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isAdmin: user?.role === 'admin',
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
