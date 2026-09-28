import prisma from '@/lib/db';
import { EntityStatus } from '@prisma/client';

export class DocumentService {
  static async createDocumentRecord(data: {
    projectId?: string;
    documentType: string;
    filename: string;
    storageKey: string;
    uploadedBy: string;
  }) {
    const document = await prisma.document.create({
      data: {
        ...data,
        status: EntityStatus.ACTIVE,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: data.uploadedBy,
        action: 'DOCUMENT_UPLOADED',
        entityType: 'Document',
        entityId: document.id,
        metadata: { filename: data.filename, storageKey: data.storageKey },
      },
    });

    return document;
  }

  static async getDocuments(projectId?: string) {
    const where = projectId ? { projectId, status: EntityStatus.ACTIVE } : { status: EntityStatus.ACTIVE };
    return prisma.document.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      include: {
        project: { select: { name: true, code: true } },
      }
    });
  }

  static async getDocumentById(id: string) {
    return prisma.document.findUnique({
      where: { id },
    });
  }

  static async deleteDocumentRecord(id: string, deletedBy: string) {
    const document = await prisma.document.update({
      where: { id },
      data: { status: EntityStatus.INACTIVE },
    });

    await prisma.auditLog.create({
      data: {
        actorId: deletedBy,
        action: 'DOCUMENT_DELETED',
        entityType: 'Document',
        entityId: document.id,
        metadata: { filename: document.filename, storageKey: document.storageKey },
      },
    });

    return document;
  }
  
  static async logDocumentDownload(documentId: string, downloadedBy: string) {
    await prisma.auditLog.create({
      data: {
        actorId: downloadedBy,
        action: 'DOCUMENT_DOWNLOADED',
        entityType: 'Document',
        entityId: documentId,
      },
    });
  }
}
