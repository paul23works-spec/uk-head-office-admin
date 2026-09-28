import { prisma } from './db';

export interface AnalyticsFilters {
  projectId?: string;
  status?: string;
  vendorId?: string;
  stageCode?: string;
}

export async function getAnalyticsMetrics(filters: AnalyticsFilters = {}) {
  const now = new Date();

  const projectWhere = {
    ...(filters.projectId ? { id: filters.projectId } : {}),
    ...(filters.status ? { status: filters.status as any } : {}),
  };

  const genericWhere = {
    ...(filters.projectId ? { projectId: filters.projectId } : {}),
  };

  // Project Metrics
  const projectsCount = await prisma.project.count({ where: projectWhere });
  const projectsByStatus = await prisma.project.groupBy({
    by: ['status'],
    where: projectWhere,
    _count: { id: true },
  });

  // Project Stages / Progress
  const stagesWhere = {
    ...genericWhere,
    ...(filters.stageCode ? { code: filters.stageCode } : {})
  };
  const stagesCount = await prisma.projectStage.count({ where: stagesWhere });
  const stagesByStatus = await prisma.projectStage.groupBy({
    by: ['status'],
    where: stagesWhere,
    _count: { id: true },
  });

  // Action Items
  const actionItemsCount = await prisma.actionItem.count({ where: genericWhere });
  const actionItemsByStatus = await prisma.actionItem.groupBy({
    by: ['status'],
    where: genericWhere,
    _count: { id: true },
  });
  const overdueActionItems = await prisma.actionItem.count({
    where: {
      ...genericWhere,
      dueDate: { lt: now },
      status: { not: 'COMPLETED' },
    },
  });

  // Documents
  const documentsCount = await prisma.document.count({ where: genericWhere });
  const documentsByType = await prisma.document.groupBy({
    by: ['documentType'],
    where: genericWhere,
    _count: { id: true },
  });
  const documentsByStatus = await prisma.document.groupBy({
    by: ['processingStatus'],
    where: genericWhere,
    _count: { id: true },
  });

  // Organizations
  const orgWhere = {
    ...(filters.vendorId ? { id: filters.vendorId } : {})
  };
  const organizationsCount = await prisma.organization.count({ where: orgWhere });
  const organizationsByType = await prisma.organization.groupBy({
    by: ['type'],
    where: orgWhere,
    _count: { id: true },
  });

  // BOQ Metrics
  const boqWhere = {
    ...(filters.projectId ? { boq: { projectId: filters.projectId } } : {})
  };
  const boqItemsCount = await prisma.bOQItem.count({ where: boqWhere });
  const boqTotalValueResult = await prisma.bOQItem.aggregate({
    where: boqWhere,
    _sum: {
      amount: true,
    },
  });
  const boqTotalValue = boqTotalValueResult._sum?.amount || 0;

  // Communications & Notifications
  // Notifications uses userId or similar, we won't strictly filter them by project unless relation exists.
  // For simplicity, we just return overall or filtered if possible.
  const notificationsCount = await prisma.notification.count();
  const notificationsByStatus = await prisma.notification.groupBy({
    by: ['status'],
    _count: { id: true },
  });
  
  const communicationsCount = await prisma.communicationLog.count();
  const communicationsByDirection = await prisma.communicationLog.groupBy({
    by: ['direction'],
    _count: { id: true },
  });

  return {
    projects: {
      total: projectsCount,
      byStatus: projectsByStatus.map((s) => ({ status: s.status, count: s._count.id })),
    },
    stages: {
      total: stagesCount,
      byStatus: stagesByStatus.map((s) => ({ status: s.status, count: s._count.id })),
    },
    actionItems: {
      total: actionItemsCount,
      overdue: overdueActionItems,
      byStatus: actionItemsByStatus.map((s) => ({ status: s.status, count: s._count.id })),
    },
    documents: {
      total: documentsCount,
      byType: documentsByType.map((d) => ({ type: d.documentType, count: d._count.id })),
      byStatus: documentsByStatus.map((d) => ({ status: d.processingStatus, count: d._count.id })),
    },
    organizations: {
      total: organizationsCount,
      byType: organizationsByType.map((o) => ({ type: o.type, count: o._count.id })),
    },
    boq: {
      totalItems: boqItemsCount,
      totalValue: boqTotalValue,
    },
    communications: {
      notifications: {
        total: notificationsCount,
        byStatus: notificationsByStatus.map((s) => ({ status: s.status, count: s._count.id })),
      },
      logs: {
        total: communicationsCount,
        byDirection: communicationsByDirection.map((c) => ({ direction: c.direction, count: c._count.id })),
      },
    },
  };
}
