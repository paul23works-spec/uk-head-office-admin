import prisma from '@/lib/db';

export class DelegationService {
  static async getDelegationsForGrantee(granteeId: string) {
    const now = new Date();
    // Replicates existing logic: find active delegations for the grantee
    return prisma.delegation.findMany({
      where: {
        grantee: { employeeId: granteeId },
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        grantor: {
          include: { role: true }
        },
      },
    });
  }

  static async getDelegationsForGrantor(grantorId: string) {
    return prisma.delegation.findMany({
      where: {
        grantor: { employeeId: grantorId },
      },
      include: {
        grantee: {
          include: { role: true }
        },
      },
    });
  }

  static async createDelegation(data: {
    grantorId: string;
    granteeId: string;
    startDate: Date;
    endDate: Date;
    reason: string;
    createdBy: string;
  }) {
    // Need to resolve employee IDs to internal IDs
    const grantor = await prisma.employee.findUnique({ where: { employeeId: data.grantorId } });
    const grantee = await prisma.employee.findUnique({ where: { employeeId: data.granteeId } });

    if (!grantor || !grantee) {
      throw new Error('Grantor or Grantee not found');
    }

    return prisma.delegation.create({
      data: {
        grantorId: grantor.id,
        granteeId: grantee.id,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        createdBy: data.createdBy,
        status: 'ACTIVE',
      },
    });
  }

  static async revokeDelegation(id: string) {
    return prisma.delegation.update({
      where: { id },
      data: { status: 'REVOKED' },
    });
  }
}
