export type DelegationStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface Delegation {
  id: string;
  grantorId: string;
  granteeId: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  reason?: string;
  status: DelegationStatus;
  createdBy: string;
  createdAt: string; // ISO 8601
}

export type LeaveStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface Leave {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  reason: string;
  status: LeaveStatus;
}

const DELEGATION_STORAGE_KEY = 'admin_delegations';
const LEAVE_STORAGE_KEY = 'admin_leaves';

function getDelegations(): Delegation[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(DELEGATION_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveDelegations(delegations: Delegation[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DELEGATION_STORAGE_KEY, JSON.stringify(delegations));
    window.dispatchEvent(new CustomEvent('delegation-change'));
  }
}

function getLeaves(): Leave[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LEAVE_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveLeaves(leaves: Leave[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(leaves));
    window.dispatchEvent(new CustomEvent('leave-change'));
  }
}

export const delegationStore = {
  createDelegation(
    grantorId: string,
    granteeId: string,
    startDate: string,
    endDate: string,
    createdBy: string,
    reason?: string
  ): Delegation {
    const newDelegation: Delegation = {
      id: crypto.randomUUID(),
      grantorId,
      granteeId,
      startDate,
      endDate,
      reason,
      status: 'ACTIVE',
      createdBy,
      createdAt: new Date().toISOString(),
    };

    const delegations = getDelegations();
    delegations.push(newDelegation);
    saveDelegations(delegations);
    
    return newDelegation;
  },

  revokeDelegation(id: string) {
    const delegations = getDelegations();
    const index = delegations.findIndex((d) => d.id === id);
    if (index !== -1) {
      delegations[index].status = 'REVOKED';
      saveDelegations(delegations);
    }
  },

  getAllDelegations(): Delegation[] {
    return getDelegations();
  },

  getActiveDelegations(): Delegation[] {
    const now = new Date();
    return getDelegations().filter((d) => {
      if (d.status !== 'ACTIVE') return false;
      const start = new Date(d.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d.endDate);
      end.setHours(23, 59, 59, 999);
      return now >= start && now <= end;
    });
  },

  getActiveDelegationsForGrantee(granteeId: string): Delegation[] {
    const now = new Date();
    return getDelegations().filter((d) => {
      if (d.granteeId !== granteeId) return false;
      if (d.status !== 'ACTIVE') return false;
      
      const start = new Date(d.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d.endDate);
      end.setHours(23, 59, 59, 999);
      return now >= start && now <= end;
    });
  },

  createLeave(
    employeeId: string,
    employeeName: string,
    role: string,
    startDate: string,
    endDate: string,
    reason: string
  ): Leave {
    const newLeave: Leave = {
      id: crypto.randomUUID(),
      employeeId,
      employeeName,
      role,
      startDate,
      endDate,
      reason,
      status: 'ACTIVE',
    };

    const leaves = getLeaves();
    leaves.push(newLeave);
    saveLeaves(leaves);
    
    return newLeave;
  },

  cancelLeave(id: string) {
    const leaves = getLeaves();
    const index = leaves.findIndex((l) => l.id === id);
    if (index !== -1) {
      leaves[index].status = 'CANCELLED';
      saveLeaves(leaves);
    }
  },

  getAllLeaves(): Leave[] {
    return getLeaves();
  },
};
