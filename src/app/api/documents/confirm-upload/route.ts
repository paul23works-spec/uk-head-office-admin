import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import { DocumentService } from '@/lib/services/document.service';
import { verifyFileExists } from '@/lib/storage-server';
import { DocumentIntelligenceService } from '@/lib/services/document-intelligence.service';

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!['MASTER', 'ADMIN_A', 'ADMIN_B', 'ADMIN_C'].includes(user.role)) {
       return NextResponse.json({ success: false, error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const { storageKey, filename, documentType, projectId } = await req.json();

    if (!storageKey || !filename || !documentType) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the file was actually uploaded to Supabase
    const exists = await verifyFileExists(storageKey);
    if (!exists) {
      return NextResponse.json({ success: false, error: 'File not found in storage. Upload may have failed.' }, { status: 400 });
    }

    let dbProjectId: string | undefined = undefined;
    if (projectId) {
      const { default: prisma } = await import('@/lib/db');
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });
      if (project) {
        dbProjectId = project.id;
      } else {
        return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
      }
    }

    // Save metadata to database (this handles the audit logging internally)
    const document = await DocumentService.createDocumentRecord({
      projectId: dbProjectId,
      documentType,
      filename,
      storageKey,
      uploadedBy: user.employeeId,
    });

    // Fire and forget document intelligence extraction
    DocumentIntelligenceService.processDocument(document.id).catch(console.error);

    return NextResponse.json({ success: true, data: document }, { status: 201 });
  } catch (error: any) {
    console.error('Confirm upload error:', error);
    return NextResponse.json({ success: false, error: 'Failed to confirm document upload.' }, { status: 500 });
  }
}
