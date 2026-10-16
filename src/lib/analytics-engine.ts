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

  const stagesWhere = {
    ...genericWhere,
    ...(filters.stageCode ? { code: filters.stageCode } : {})
  };

  const orgWhere = {
    ...(filters.vendorId ? { id: filters.vendorId } : {})
  };

  const boqWhere = {
    ...(filters.projectId ? { boq: { projectId: filters.projectId } } : {})
  };

  // Parallel execution of independent analytics queries
  const [
    projectsCount,
    projectsByStatus,
    stagesCount,
    stagesByStatus,
    actionItemsCount,
    actionItemsByStatus,
    overdueActionItems,
    documentsCount,
    documentsByType,
    documentsByStatus,
    organizationsCount,
    organizationsByType,
    boqItemsCount,
    boqTotalValueResult,
    notificationsCount,
    notificationsByStatus,
    communicationsCount,
    communicationsByDirection,
  ] = await Promise.all([
    // Project Metrics
    prisma.project.count({ where: projectWhere }),
    prisma.project.groupBy({
      by: ['status'],
      where: projectWhere,
      _count: { id: true },
    }),

    // Project Stages / Progress
    prisma.projectStage.count({ where: stagesWhere }),
    prisma.projectStage.groupBy({
      by: ['status'],
      where: stagesWhere,
      _count: { id: true },
    }),

    // Action Items
    prisma.actionItem.count({ where: genericWhere }),
    prisma.actionItem.groupBy({
      by: ['status'],
      where: genericWhere,
      _count: { id: true },
    }),
    prisma.actionItem.count({
      where: {
        ...genericWhere,
        dueDate: { lt: now },
        status: { not: 'COMPLETED' },
      },
    }),

    // Documents
    prisma.document.count({ where: genericWhere }),
    prisma.document.groupBy({
      by: ['documentType'],
      where: genericWhere,
      _count: { id: true },
    }),
    prisma.document.groupBy({
      by: ['processingStatus'],
      where: genericWhere,
      _count: { id: true },
    }),

    // Organizations
    prisma.organization.count({ where: orgWhere }),
    prisma.organization.groupBy({
      by: ['type'],
      where: orgWhere,
      _count: { id: true },
    }),

    // BOQ Metrics
    prisma.bOQItem.count({ where: boqWhere }),
    prisma.bOQItem.aggregate({
      where: boqWhere,
      _sum: {
        amount: true,
      },
    }),

    // Communications & Notifications
    // Notifications uses userId or similar, we won't strictly filter them by project unless relation exists.
    // For simplicity, we just return overall or filtered if possible.
    prisma.notification.count(),
    prisma.notification.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.communicationLog.count(),
    prisma.communicationLog.groupBy({
      by: ['direction'],
      _count: { id: true },
    }),
  ]);

  const boqTotalValue = boqTotalValueResult._sum?.amount || 0;

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
