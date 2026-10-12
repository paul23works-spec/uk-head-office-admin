'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AppRole, USERS } from './permissions';
import { sessionStore } from './session-store';

export function toClientUser(serverUser: {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  department: string | null;
  needsPasswordChange?: boolean;
}): User {
  const initials = serverUser.name
    ? serverUser.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : 'UK';
  return {
    id: serverUser.id,
    name: serverUser.name,
    role: serverUser.role as AppRole,
    avatarInitials: initials,
    employeeId: serverUser.employeeId,
    department: serverUser.department || 'Operations',
    needsPasswordChange: !!serverUser.needsPasswordChange,
  };
}

interface AuthContextType {
  user: User | null;
  sessionId: string | null;
  setAuthenticatedUser: (user: User) => void;
  login: (roleOrUser?: AppRole | User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      try {
        const res = await fetch('/api/auth');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            const clientUser = toClientUser(data.user);
            setUser(clientUser);
            setSessionId(clientUser.employeeId);
          } else {
            setUser(null);
            setSessionId(null);
          }
        } else {
          setUser(null);
          setSessionId(null);
        }
      } catch (err) {
        setUser(null);
        setSessionId(null);
      } finally {
        setIsLoading(false);
      }
    }

    verifySession();
  }, []);

  const setAuthenticatedUser = (clientUser: User) => {
    const newSessionId = sessionStore.createSession(
      clientUser.employeeId,
      clientUser.name,
      clientUser.department,
      clientUser.role
    );
    setUser(clientUser);
    setSessionId(newSessionId);
    try {
      sessionStorage.setItem('ukg_brand_intro_pending', 'true');
    } catch (e) {
      // Safe fallback if sessionStorage is unavailable
    }
  };

  const login = (roleOrUser?: AppRole | User) => {
    if (!roleOrUser) return;
    if (typeof roleOrUser === 'object') {
      setAuthenticatedUser(roleOrUser);
      return;
    }
    // Fallback lookup from known roles for legacy callers
    const found = USERS.find((u) => u.role === roleOrUser);
    if (found) {
      setAuthenticatedUser(found);
    }
  };

  const logout = () => {
    // End server session via HTTP-only cookie deletion
    fetch('/api/auth', { method: 'DELETE' }).catch(console.error);

    if (sessionId) {
      sessionStore.endSession(sessionId);
    }
    setUser(null);
    setSessionId(null);
    try {
      localStorage.removeItem('auth_user_role');
      localStorage.removeItem('auth_session_id');
      sessionStorage.removeItem('ukg_brand_intro_pending');
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('delegation_notified_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch (e) {
      // Safe fallback
    }
  };

  return (
    <AuthContext.Provider value={{ user, sessionId, setAuthenticatedUser, login, logout, isLoading }}>
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
