export type AppRole = 'MASTER' | 'ADMIN_A' | 'ADMIN_B' | 'ADMIN_C';

export interface User {
  id: string;
  name: string;
  role: AppRole;
  avatarInitials: string;
}

export const USERS: User[] = [
  { id: 'u1', name: 'Master Administrator', role: 'MASTER', avatarInitials: 'MA' },
  { id: 'u2', name: 'Admin A (Tender & Contracts)', role: 'ADMIN_A', avatarInitials: 'AA' },
  { id: 'u3', name: 'Admin B (Procurement & Insp)', role: 'ADMIN_B', avatarInitials: 'AB' },
  { id: 'u4', name: 'Admin C (Dispatch & Billing)', role: 'ADMIN_C', avatarInitials: 'AC' },
];

/**
 * Validates if a specific role has edit access to a given stage.
 * Stages 01-04: Admin A
 * Stages 05-09: Admin B (also BOQ)
 * Stages 10-13: Admin C
 * Master has access to all.
 */
export function canEditStage(role: AppRole | undefined | null, stageId: string): boolean {
  if (!role) return false;
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
