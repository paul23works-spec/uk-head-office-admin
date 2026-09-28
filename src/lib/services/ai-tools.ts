import { prisma } from '../db';
import { SessionUser } from '../auth-server';
import { checkBasePermission } from '../permissions-server';

export class AITools {
  static async getProjects(user: SessionUser) {
    // All authenticated users can list active projects, but only basic details.
    return prisma.project.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        client: true,
        status: true,
        startDate: true,
        expectedCompletion: true,
      }
    });
  }

  static async getProjectSummary(user: SessionUser, projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        stages: true,
      }
    });
    if (!project) throw new Error('Project not found');
    return project;
  }

  static async getProjectStages(user: SessionUser, projectId: string) {
    const stages = await prisma.projectStage.findMany({
      where: { projectId },
      orderBy: { stageId: 'asc' }
    });
    return stages;
  }

  static async getDocuments(user: SessionUser, projectId: string, documentType?: string) {
    const whereClause: any = { projectId };
    if (documentType) whereClause.documentType = documentType;
    
    return prisma.document.findMany({
      where: whereClause,
      select: {
        id: true,
        documentType: true,
        filename: true,
        status: true,
        processingStatus: true,
        uploadedAt: true,
        referenceNo: true,
      }
    });
  }

  static async getDocument(user: SessionUser, documentId: string) {
    return prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        documentType: true,
        filename: true,
        status: true,
        processingStatus: true,
        extractedData: true, // Metadata only, not raw storage credentials
        referenceNo: true,
      }
    });
  }

  static async searchDocuments(user: SessionUser, projectId: string, query: string) {
    // Basic Prisma filtering for filename or ref number
    return prisma.document.findMany({
      where: {
        projectId,
        OR: [
          { filename: { contains: query, mode: 'insensitive' } },
          { referenceNo: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        filename: true,
        documentType: true,
        referenceNo: true,
      }
    });
  }

  static async getOrganizations(user: SessionUser) {
    return prisma.organization.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        status: true,
      }
    });
  }

  static async getOrganization(user: SessionUser, id: string) {
    return prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        contactInfo: true,
        status: true,
      }
    });
  }

  static async getActionItems(user: SessionUser, projectId: string) {
    return prisma.actionItem.findMany({
      where: { projectId },
      include: {
        assignedTo: { select: { name: true, roleId: true } }
      }
    });
  }

  static async getOverdueActions(user: SessionUser, projectId: string) {
    return prisma.actionItem.findMany({
      where: {
        projectId,
        dueDate: { lt: new Date() },
        status: { not: 'COMPLETED' }
      },
      include: {
        assignedTo: { select: { name: true, roleId: true } }
      }
    });
  }

  static async getBOQSummary(user: SessionUser, projectId: string) {
    // RBAC Validation: Only MASTER or ADMIN_B can view financial data
    if (user.role !== 'MASTER' && user.role !== 'ADMIN_B') {
      return { error: 'Unauthorized: You do not have permission to view financial BOQ summaries.' };
    }

    const boq = await prisma.bOQ.findFirst({
      where: { projectId },
      include: {
        items: true
      }
    });

    if (!boq) return { message: 'No BOQ found for this project.' };

    const totalValue = boq.items.reduce((acc, item) => acc + item.amount, 0);
    return {
      referenceNo: boq.referenceNo,
      title: boq.title,
      totalItems: boq.items.length,
      totalValue,
      status: boq.status,
    };
  }

  static async getNotifications(user: SessionUser) {
    return prisma.notification.findMany({
      where: { recipientId: user.employeeId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }

  static async getCommunicationHistory(user: SessionUser, projectId: string) {
    return prisma.communicationLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        channel: true,
        direction: true,
        from: true,
        to: true,
        subject: true,
        status: true,
        createdAt: true,
      }
    });
  }
}
