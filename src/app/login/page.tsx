'use client';

import { useAuth } from '@/lib/auth-context';
import { USERS, AppRole } from '@/lib/permissions';
import { useRouter } from 'next/navigation';
import { Shield, User, Lock } from 'lucide-react';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, login, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const handleLogin = (role: AppRole) => {
    login(role);
    router.push('/');
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-8 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold font-editorial tracking-tight text-white">UK Head Office Admin</h1>
          <p className="text-slate-400 text-sm mt-2">Project Control Center</p>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6 text-sm font-semibold text-slate-700">
            <Lock className="w-4 h-4" />
            <span>Select Simulated Role</span>
          </div>

          <div className="space-y-3">
            {USERS.map((u) => (
              <button
                key={u.id}
                onClick={() => handleLogin(u.role)}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                    {u.avatarInitials}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.role}</div>
                  </div>
                </div>
                <User className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>
          
          <div className="mt-8 text-center text-xs text-slate-400">
            Phase 6.1 — Simulated Authentication Layer
          </div>
        </div>
      </div>
    </div>
  );
}
