'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Clock, LogIn, LogOut, Navigation, Building2, User, Activity as ActivityIcon, Users } from 'lucide-react';
import { sessionStore, Session } from '@/lib/session-store';
import { useProjects } from '@/lib/project-context';

export default function ManagementActivityPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const { activities } = useProjects();
  const [activeTab, setActiveTab] = useState<'sessions' | 'system'>('sessions');

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'MASTER') {
        router.push('/');
      } else {
        setSessions(sessionStore.getAllSessions().reverse());
        
        const interval = setInterval(() => {
          setSessions(sessionStore.getAllSessions().reverse());
        }, 5000);
        return () => clearInterval(interval);
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'MASTER') {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4 text-slate-400">
          <ShieldAlert className="w-8 h-8" />
          <p>Verifying Permissions...</p>
        </div>
      </div>
    );
  }

  const formatTime = (isoString?: string) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const calculateDuration = (start: string, end?: string) => {
    if (!end) return 'Active';
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const diffMins = Math.round(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-editorial text-slate-900 flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-emerald-600" />
            Management Activity Monitor
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            System-wide active user sessions and activity tracking.
          </p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600">
            <User className="w-3.5 h-3.5 text-slate-400" />
            {user.name}
          </span>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`
              whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2
              ${activeTab === 'sessions' 
                ? 'border-emerald-500 text-emerald-600' 
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}
            `}
          >
            <Users className="w-4 h-4" />
            Session History
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`
              whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2
              ${activeTab === 'system' 
                ? 'border-emerald-500 text-emerald-600' 
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}
            `}
          >
            <ActivityIcon className="w-4 h-4" />
            System Activity
          </button>
        </nav>
      </div>

      {activeTab === 'sessions' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Currently / Last Working On</th>
                  <th className="px-6 py-4">Session Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No active or historical sessions found.
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => {
                    const isOnline = session.status === 'ONLINE';
                    return (
                      <tr key={session.sessionId} className={isOnline ? 'bg-white hover:bg-slate-50 transition-colors' : 'bg-slate-50/50 opacity-80 hover:bg-slate-100/50 transition-colors'}>
                        <td className="px-6 py-4 align-top">
                          <div className="font-semibold text-slate-900">{session.employeeName}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3" />
                            {session.department}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          {isOnline ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Offline
                            </span>
                          )}
                          <div className="text-[10px] text-slate-400 mt-2 font-mono uppercase">
                            {formatDate(session.loginTime)}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-start gap-2">
                            <Navigation className={`w-4 h-4 mt-0.5 ${isOnline ? 'text-blue-500' : 'text-slate-400'}`} />
                            <div>
                              <span className="font-medium text-slate-700">{session.currentStage}</span>
                              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Last active: {formatTime(session.lastActive)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between gap-4 text-slate-600">
                              <span className="flex items-center gap-1.5"><LogIn className="w-3.5 h-3.5 text-slate-400" /> Login:</span>
                              <span className="font-mono">{formatTime(session.loginTime)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-slate-600">
                              <span className="flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5 text-slate-400" /> Logout:</span>
                              <span className="font-mono">{formatTime(session.logoutTime)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 pt-1 mt-1 border-t border-slate-100 text-slate-700 font-semibold">
                              <span>Duration:</span>
                              <span>{calculateDuration(session.loginTime, session.logoutTime)}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Action Details</th>
                  <th className="px-6 py-4">Performed By</th>
                  <th className="px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                      No system activity recorded yet.
                    </td>
                  </tr>
                ) : (
                  activities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 align-top max-w-md">
                        <div className="font-medium text-slate-900">{activity.action}</div>
                        <div className="text-xs text-slate-500 mt-1 line-clamp-2">{activity.details}</div>
                        <div className="text-xs font-mono text-slate-400 mt-2">Project: {activity.projectId}</div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="font-semibold text-slate-900">{activity.user}</div>
                        <div className="text-xs text-slate-500 flex flex-col gap-1 mt-1">
                          {activity.actingRole && <span>Role: {activity.actingRole}</span>}
                          {activity.onBehalfOfId && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                              On Behalf Of: {activity.onBehalfOfId}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top whitespace-nowrap text-slate-500">
                        {activity.timestamp}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
