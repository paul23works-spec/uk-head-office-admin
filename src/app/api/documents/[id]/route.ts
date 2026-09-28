import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import { DocumentService } from '@/lib/services/document.service';
import { getSignedDownloadUrl, deleteFromStorage } from '@/lib/storage-server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Document ID is required' }, { status: 400 });
    }

    const document = await DocumentService.getDocumentById(id);
    if (!document || document.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    // Generate a secure signed URL valid for 60 seconds
    const signedUrl = await getSignedDownloadUrl(document.storageKey, 60);

    // Audit log
    await DocumentService.logDocumentDownload(document.id, user.employeeId);

    return NextResponse.json({ success: true, data: { url: signedUrl } });
  } catch (error: any) {
    console.error('Error generating document URL:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve document.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Basic RBAC for deletion
    if (!['MASTER', 'ADMIN_A', 'ADMIN_B', 'ADMIN_C'].includes(user.role)) {
       return NextResponse.json({ success: false, error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Document ID is required' }, { status: 400 });
    }

    const document = await DocumentService.getDocumentById(id);
    if (!document || document.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    // 1. Delete from Supabase Storage
    await deleteFromStorage(document.storageKey);

    // 2. Mark as INACTIVE in Database and log it
    await DocumentService.deleteDocumentRecord(document.id, user.employeeId);

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete document.' }, { status: 500 });
  }
}
