import { prisma } from '../db';
import { SessionUser } from '../auth-server';

export class AuditService {
  /**
   * Logs a significant mutation or action within the platform.
   */
  static async log(
    user: SessionUser | { employeeId: string },
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'LOGIN' | 'AI_ACTION' | 'UPLOAD',
    entityType: 'Project' | 'Document' | 'Organization' | 'User' | 'ActionItem' | 'CommunicationLog' | 'System',
    entityId: string,
    metadata?: Record<string, any>
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: user.employeeId,
          action,
          entityType,
          entityId,
          metadata: metadata || {}
        }
      });
      console.log(`[AuditLog] ${action} ${entityType} ${entityId} by ${user.employeeId}`);
    } catch (error) {
      console.error('[AuditService] Failed to create audit log:', error);
    }
  }
}
