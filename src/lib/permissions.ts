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
