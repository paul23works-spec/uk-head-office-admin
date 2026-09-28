'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { delegationStore, Delegation, Leave } from '@/lib/delegation-store';
import { USERS, User, checkBasePermission } from '@/lib/permissions';

export interface DelegatedCoverage {
  delegation: Delegation;
  leave?: Leave;
  grantor: User | undefined;
  grantorRole: string;
  delegatedStageIds: string[];
}

export function useActiveDelegation() {
  const { user } = useAuth();
  const [activeDelegations, setActiveDelegations] = useState<Delegation[]>([]);
  const [allActiveDelegations, setAllActiveDelegations] = useState<Delegation[]>([]);

  const refreshDelegations = useCallback(() => {
    if (typeof window === 'undefined') return;

    const all = delegationStore.getActiveDelegations();
    setAllActiveDelegations((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(all)) return prev;
      return all;
    });

    if (user?.employeeId) {
      const granteeDelegations = delegationStore.getActiveDelegationsForGrantee(user.employeeId);
      setActiveDelegations((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(granteeDelegations)) return prev;
        return granteeDelegations;
      });
    } else {
      setActiveDelegations((prev) => (prev.length === 0 ? prev : []));
    }
  }, [user]);

  useEffect(() => {
    refreshDelegations();

    const handleUpdate = () => {
      refreshDelegations();
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('delegation-change', handleUpdate);
    window.addEventListener('leave-change', handleUpdate);

    // Periodically check for expired delegations
    const interval = setInterval(handleUpdate, 30000);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('delegation-change', handleUpdate);
      window.removeEventListener('leave-change', handleUpdate);
      clearInterval(interval);
    };
  }, [refreshDelegations]);

  const allKnownStages = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', 'BOQ'];
  const allLeaves = typeof window !== 'undefined' ? delegationStore.getAllLeaves() : [];

  const coverages: DelegatedCoverage[] = activeDelegations.map((del) => {
    const grantor = USERS.find((u) => u.employeeId === del.grantorId);
    const delegatedStageIds = allKnownStages.filter(
      (stageId) => grantor && checkBasePermission(grantor.role, stageId) && (!user || !checkBasePermission(user.role, stageId))
    );

    // Find a matching leave for this delegation
    const leave = allLeaves.find((l) => 
      l.employeeId === del.grantorId && 
      l.status === 'ACTIVE' && 
      l.startDate === del.startDate && 
      l.endDate === del.endDate
    );

    return {
      delegation: del,
      leave,
      grantor,
      grantorRole: grantor?.role || 'UNKNOWN',
      delegatedStageIds,
    };
  });

  const hasActiveDelegation = coverages.length > 0;

  const debugInfo = {
    employeeId: user?.employeeId,
    role: user?.role,
    name: user?.name,
    department: user?.department,
    rawAdminDelegations: typeof window !== 'undefined' ? localStorage.getItem('admin_delegations') : null,
    rawAdminLeaves: typeof window !== 'undefined' ? localStorage.getItem('admin_leaves') : null,
    getActiveDelegationsForGranteeResult: user?.employeeId ? delegationStore.getActiveDelegationsForGrantee(user.employeeId) : [],
    activeDelegationsState: activeDelegations,
    coveragesResult: coverages,
    hasActiveDelegationResult: hasActiveDelegation
  };

  return {
    activeDelegations,
    allActiveDelegations,
    coverages,
    hasActiveDelegation,
    refreshDelegations,
    debugInfo
  };
}
