/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

interface User {
  id: number;
  username: string;
  role: 'Administrator' | 'Pharmacist' | 'Cashier' | 'Patient';
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = '/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('aria_token');
      if (token) {
        try {
          const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            localStorage.removeItem('aria_token');
          }
        } catch (err) {
          console.error('Initial auth check failed:', err);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: any) => {
    setAuthError(null);
    try {
      const data = await api.auth.login(credentials);
      localStorage.setItem('aria_token', data.token);
      setUser(data.user);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('aria_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, authError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
