import prisma from '@/lib/db';
import { Document, ActionItem } from '@prisma/client';

export class ActionEngine {
  /**
   * Evaluates a processed document and creates appropriate action items.
   */
  static async evaluateDocument(documentId: string): Promise<void> {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        project: true
      }
    });

    if (!doc) return;
    if (doc.processingStatus !== 'COMPLETED') return;

    const documentType = doc.documentType?.toUpperCase() || '';
    
    // Example rules for Document -> ActionItem creation
    
    // 1. If LOI or LOA uploaded -> Action: Accept LOI/LOA
    if (documentType.includes('LOI') || documentType.includes('LOA') || documentType.includes('LETTER OF INTENT')) {
      await this.createActionItem({
        title: 'Accept LOI / LOA',
        description: `Review and accept the uploaded ${doc.documentType} (Ref: ${doc.referenceNo || 'N/A'})`,
        projectId: doc.projectId,
        documentId: doc.id,
        daysToComplete: 3
      });
    }

    // 2. If Invoice / Progressive Bill -> Action: Verify Bill
    if (documentType.includes('INVOICE') || documentType.includes('BILL')) {
      await this.createActionItem({
        title: 'Verify Invoice',
        description: `Verify and process invoice (Ref: ${doc.referenceNo || 'N/A'}) for payment.`,
        projectId: doc.projectId,
        documentId: doc.id,
        daysToComplete: 5
      });
    }

    // 3. If JIR (Joint Inspection Report) -> Action: Clearance / Dispatch
    if (documentType.includes('JIR') || documentType.includes('INSPECTION REPORT')) {
      await this.createActionItem({
        title: 'Dispatch Clearance',
        description: `Initiate dispatch based on approved JIR (Ref: ${doc.referenceNo || 'N/A'}).`,
        projectId: doc.projectId,
        documentId: doc.id,
        daysToComplete: 2
      });
    }
  }

  private static async createActionItem(params: {
    title: string;
    description: string;
    projectId: string | null;
    documentId: string | null;
    daysToComplete: number;
  }) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + params.daysToComplete);

    await prisma.actionItem.create({
      data: {
        title: params.title,
        description: params.description,
        dueDate,
        projectId: params.projectId,
        documentId: params.documentId,
        status: 'PENDING'
        // assignedToId could be determined based on project roles or stage definitions
      }
    });

    console.log(`Action Item created: ${params.title}`);
  }
}
