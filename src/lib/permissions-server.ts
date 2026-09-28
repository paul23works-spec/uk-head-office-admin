import { SessionUser } from './auth-server';
import { DelegationService } from './services/delegation.service';

export type AppRole = 'MASTER' | 'ADMIN_A' | 'ADMIN_B' | 'ADMIN_C';

export function checkBasePermission(role: string, stageId: string): boolean {
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
 * Validates if a user has edit access to a given stage (Base OR Delegated) on the server.
 */
export async function canEditStageServer(user: SessionUser | undefined | null, stageId: string): Promise<boolean> {
  if (!user) return false;
  if (user.role === 'MASTER') return true;
  if (stageId === 'PROJECTS') return false;

  if (checkBasePermission(user.role, stageId)) return true;

  const activeDelegations = await DelegationService.getDelegationsForGrantee(user.employeeId);
  
  for (const del of activeDelegations) {
    if (del.grantor && checkBasePermission(del.grantor.role.name, stageId)) {
      return true;
    }
  }

  return false;
}

export async function getStageActionIdentityServer(user: SessionUser | undefined | null, stageId: string): Promise<{
  isAuthorized: boolean;
  actingUserId: string;
  actingRole: string;
  onBehalfOfId?: string;
}> {
  if (!user) return { isAuthorized: false, actingUserId: '', actingRole: '' };

  if (checkBasePermission(user.role, stageId)) {
    return {
      isAuthorized: true,
      actingUserId: user.employeeId,
      actingRole: user.role,
    };
  }

  const activeDelegations = await DelegationService.getDelegationsForGrantee(user.employeeId);
  for (const del of activeDelegations) {
    if (del.grantor && checkBasePermission(del.grantor.role.name, stageId)) {
      return {
        isAuthorized: true,
        actingUserId: user.employeeId,
        actingRole: user.role,
        onBehalfOfId: del.grantorId
      };
    }
  }

  return { isAuthorized: false, actingUserId: user.employeeId, actingRole: user.role };
}
