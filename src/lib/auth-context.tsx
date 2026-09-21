'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AppRole, USERS } from './permissions';
import { sessionStore } from './session-store';

interface AuthContextType {
  user: User | null;
  sessionId: string | null;
  login: (role: AppRole) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedRole = localStorage.getItem('auth_user_role');
      const storedSession = localStorage.getItem('auth_session_id');
      if (storedRole) {
        const found = USERS.find((u) => u.role === storedRole);
        if (found) {
          setUser(found);
          if (storedSession) {
            setSessionId(storedSession);
          }
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
      const newSessionId = sessionStore.createSession(
        found.employeeId,
        found.name,
        found.department,
        found.role
      );
      setUser(found);
      setSessionId(newSessionId);
      localStorage.setItem('auth_user_role', role);
      localStorage.setItem('auth_session_id', newSessionId);
    }
  };

  const logout = () => {
    if (sessionId) {
      sessionStore.endSession(sessionId);
    }
    setUser(null);
    setSessionId(null);
    localStorage.removeItem('auth_user_role');
    localStorage.removeItem('auth_session_id');
  };

  return (
    <AuthContext.Provider value={{ user, sessionId, login, logout, isLoading }}>
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
