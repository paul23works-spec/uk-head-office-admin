'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getStageActionIdentity, USERS } from '@/lib/permissions';
import { UserCheck } from 'lucide-react';

interface DelegatedStageIndicatorProps {
  stageId: string;
  className?: string;
}

export function DelegatedStageIndicator({ stageId, className }: DelegatedStageIndicatorProps) {
  const { user } = useAuth();
  const [identity, setIdentity] = useState(() => getStageActionIdentity(user, stageId));

  useEffect(() => {
    const update = () => {
      setIdentity(getStageActionIdentity(user, stageId));
    };

    update();

    window.addEventListener('storage', update);
    window.addEventListener('delegation-change', update);
    window.addEventListener('leave-change', update);

    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('delegation-change', update);
      window.removeEventListener('leave-change', update);
    };
  }, [user, stageId]);

  if (!identity.onBehalfOfId) {
    return null;
  }

  const grantor = USERS.find((u) => u.employeeId === identity.onBehalfOfId);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium shadow-2xs ${
        className || ''
      }`}
      title={`Acting under temporary delegation from ${grantor?.name || identity.onBehalfOfId}`}
    >
      <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      <span className="flex items-center gap-1 text-[11px]">
        <span className="font-bold text-[9px] uppercase tracking-wider bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
          DELEGATED
        </span>
        <span className="hidden sm:inline text-slate-600">Acting on behalf of</span>
        <span className="font-semibold text-slate-900">{grantor?.name || identity.onBehalfOfId}</span>
        {grantor?.role && (
          <span className="text-[10px] text-amber-800 font-mono">({grantor.role})</span>
        )}
      </span>
    </div>
  );
}
