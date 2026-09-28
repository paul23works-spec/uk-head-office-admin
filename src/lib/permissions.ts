import { delegationStore } from './delegation-store';

export type AppRole = 'MASTER' | 'ADMIN_A' | 'ADMIN_B' | 'ADMIN_C';

export interface User {
  id: string;
  name: string;
  role: AppRole;
  avatarInitials: string;
  employeeId: string;
  department: string;
}

export const USERS: User[] = [
  { id: 'u1', name: 'Rajiv Sharma', role: 'MASTER', avatarInitials: 'RS', employeeId: 'EMP-001', department: 'Management' },
  { id: 'u2', name: 'Arjun Sharma', role: 'ADMIN_A', avatarInitials: 'AS', employeeId: 'EMP-002', department: 'Tender & Contracts' },
  { id: 'u3', name: 'Rohan Das', role: 'ADMIN_B', avatarInitials: 'RD', employeeId: 'EMP-003', department: 'Procurement & Inspection' },
  { id: 'u4', name: 'Priya Saikia', role: 'ADMIN_C', avatarInitials: 'PS', employeeId: 'EMP-004', department: 'Dispatch & Billing' },
];

export function checkBasePermission(role: AppRole, stageId: string): boolean {
  if (role === 'MASTER') return true;
  if (stageId === 'PROJECTS') return false;

  // Admin A: 01 to 04
  if (role === 'ADMIN_A' && ['01', '02', '03', '04'].includes(stageId)) return true;
  
  // Admin B: 05 to 09 + BOQ
  if (role === 'ADMIN_B' && ['BOQ', '05', '06', '07', '08', '09'].includes(stageId)) return true;

  // Admin C: 10 to 13
  if (role === 'ADMIN_C' && ['10', '11', '12', '13'].includes(stageId)) return true;

  return false;
}

/**
 * Validates if a user has edit access to a given stage (Base OR Delegated).
 */
export function canEditStage(user: User | undefined | null, stageId: string): boolean {
  if (!user) return false;
  if (user.role === 'MASTER') return true;
  if (stageId === 'PROJECTS') return false;

  if (checkBasePermission(user.role, stageId)) return true;

  if (typeof window !== 'undefined') {
    const activeDelegations = delegationStore.getActiveDelegationsForGrantee(user.employeeId);
    for (const del of activeDelegations) {
      const grantorUser = USERS.find(u => u.employeeId === del.grantorId);
      if (grantorUser && checkBasePermission(grantorUser.role, stageId)) {
        return true;
      }
    }
  }

  return false;
}

export function getStageActionIdentity(user: User | undefined | null, stageId: string): {
  isAuthorized: boolean;
  actingUserId: string;
  actingRole: string;
  onBehalfOfId?: string;
} {
  if (!user) return { isAuthorized: false, actingUserId: '', actingRole: '' };

  if (checkBasePermission(user.role, stageId)) {
    return {
      isAuthorized: true,
      actingUserId: user.employeeId,
      actingRole: user.role,
    };
  }

  if (typeof window !== 'undefined') {
    const activeDelegations = delegationStore.getActiveDelegationsForGrantee(user.employeeId);
    for (const del of activeDelegations) {
      const grantorUser = USERS.find(u => u.employeeId === del.grantorId);
      if (grantorUser && checkBasePermission(grantorUser.role, stageId)) {
        return {
          isAuthorized: true,
          actingUserId: user.employeeId,
          actingRole: user.role,
          onBehalfOfId: grantorUser.employeeId
        };
      }
    }
  }

  return { isAuthorized: false, actingUserId: user.employeeId, actingRole: user.role };
}
