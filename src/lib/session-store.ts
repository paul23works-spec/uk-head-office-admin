import { AppRole } from './permissions';

export type SessionStatus = 'ONLINE' | 'OFFLINE';

export interface Session {
  sessionId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  role: AppRole;
  loginTime: string; // ISO 8601
  logoutTime?: string; // ISO 8601
  lastActive: string; // ISO 8601
  currentStage: string;
  status: SessionStatus;
}

const SESSION_STORAGE_KEY = 'admin_sessions';

function getSessions(): Session[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(SESSION_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveSessions(sessions: Session[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
  }
}

export const sessionStore = {
  createSession(
    employeeId: string,
    employeeName: string,
    department: string,
    role: AppRole
  ): string {
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const newSession: Session = {
      sessionId,
      employeeId,
      employeeName,
      department,
      role,
      loginTime: now,
      lastActive: now,
      currentStage: 'Dashboard',
      status: 'ONLINE',
    };

    const sessions = getSessions();
    sessions.push(newSession);
    saveSessions(sessions);

    return sessionId;
  },

  updateSessionActivity(sessionId: string, currentStage: string) {
    const sessions = getSessions();
    const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId);
    
    if (sessionIndex !== -1) {
      sessions[sessionIndex].lastActive = new Date().toISOString();
      sessions[sessionIndex].currentStage = currentStage;
      saveSessions(sessions);
    }
  },

  endSession(sessionId: string) {
    const sessions = getSessions();
    const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId);
    
    if (sessionIndex !== -1) {
      sessions[sessionIndex].logoutTime = new Date().toISOString();
      sessions[sessionIndex].status = 'OFFLINE';
      saveSessions(sessions);
    }
  },

  getAllSessions(): Session[] {
    return getSessions();
  }
};
