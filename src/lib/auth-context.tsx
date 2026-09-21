'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AppRole, USERS } from './permissions';

interface AuthContextType {
  user: User | null;
  login: (role: AppRole) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user_role');
      if (stored) {
        const found = USERS.find((u) => u.role === stored);
        if (found) {
          setUser(found);
        }
      }
    } catch (err) {
      console.warn('Failed to read auth from localStorage');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (role: AppRole) => {
    const found = USERS.find((u) => u.role === role);
    if (found) {
      setUser(found);
      localStorage.setItem('auth_user_role', role);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user_role');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
