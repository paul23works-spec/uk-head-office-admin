import { prisma } from '../db';
import { SessionUser } from '../auth-server';
import { checkBasePermission } from '../permissions-server';
import { getAnalyticsMetrics, AnalyticsFilters } from '../analytics-engine';

export class AITools {
  private static async verifyProjectAccess(user: SessionUser, projectId: string): Promise<boolean> {
    if (user.role === 'MASTER') return true;
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { employees: true }
    });
    
    if (!project) return false;
    
    if (project.employees.length === 0) return true;
    return project.employees.some(e => e.employeeId === user.employeeId);
  }

  static async getProjects(user: SessionUser) {
    const allProjects = await prisma.project.findMany({
      include: { employees: true }
    });
    
    const scoped = user.role === 'MASTER' 
      ? allProjects 
      : allProjects.filter(p => p.employees.length === 0 || p.employees.some(e => e.employeeId === user.employeeId));
      
    return scoped.map(p => ({
      id: p.id,
      code: p.code,
      name: p.name,
      client: p.client,
      status: p.status,
      startDate: p.startDate,
      expectedCompletion: p.expectedCompletion
    }));
  }

  static async getProjectSummary(user: SessionUser, projectId: string) {
    if (!(await this.verifyProjectAccess(user, projectId))) {
      return { error: "I don't have access to that project." };
    }
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { stages: true }
    });
    return project || { error: 'Project not found' };
  }

  static async getProjectStages(user: SessionUser, projectId: string) {
    if (!(await this.verifyProjectAccess(user, projectId))) {
      return { error: "I don't have access to that project." };
    }
    return prisma.projectStage.findMany({
      where: { projectId },
      orderBy: { stageId: 'asc' }
    });
  }

  static async getDocuments(user: SessionUser, projectId: string, documentType?: string) {
    if (!(await this.verifyProjectAccess(user, projectId))) {
      return { error: "I don't have access to that project." };
    }
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
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc || !doc.projectId) return { error: "I don't have access to that document." };
    
    if (!(await this.verifyProjectAccess(user, doc.projectId))) {
      return { error: "I don't have access to that document." };
    }
    
    return prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        documentType: true,
        filename: true,
        status: true,
        processingStatus: true,
        extractedData: true,
        referenceNo: true,
      }
    });
  }

  static async searchDocuments(user: SessionUser, projectId: string, query: string) {
    if (!(await this.verifyProjectAccess(user, projectId))) {
      return { error: "I don't have access to that project." };
    }
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
    if (!(await this.verifyProjectAccess(user, projectId))) {
      return { error: "I don't have access to that project." };
    }
    return prisma.actionItem.findMany({
      where: { projectId },
      include: {
        assignedTo: { select: { name: true, roleId: true } }
      }
    });
  }

  static async getOverdueActions(user: SessionUser, projectId: string) {
    if (!(await this.verifyProjectAccess(user, projectId))) {
      return { error: "I don't have access to that project." };
    }
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

  static async getAllOverdueActions(user: SessionUser) {
    let projectIds: string[] = [];
    
    if (user.role === 'MASTER') {
      const all = await prisma.project.findMany({ select: { id: true } });
      projectIds = all.map(p => p.id);
    } else {
      const allProjects = await prisma.project.findMany({ include: { employees: true } });
      const scoped = allProjects.filter(p => p.employees.length === 0 || p.employees.some(e => e.employeeId === user.employeeId));
      projectIds = scoped.map(p => p.id);
    }
    
    return prisma.actionItem.findMany({
      where: {
        projectId: { in: projectIds },
        dueDate: { lt: new Date() },
        status: { not: 'COMPLETED' }
      },
      include: {
        assignedTo: { select: { name: true, roleId: true } }
      },
      take: 50
    });
  }

  static async getBOQSummary(user: SessionUser, projectId: string) {
    if (!(await this.verifyProjectAccess(user, projectId))) {
      return { error: "I don't have access to that project." };
    }
    
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
    if (!(await this.verifyProjectAccess(user, projectId))) {
      return { error: "I don't have access to that project." };
    }
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

  static async getAnalyticsSummary(user: SessionUser, filters?: AnalyticsFilters) {
    const data = await getAnalyticsMetrics(filters);
    
    if (user.role !== 'MASTER' && user.role !== 'ADMIN_B') {
      delete (data as any).boq;
    }
    
    return data;
  }
}
