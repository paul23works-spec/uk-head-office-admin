import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import { getSignedUploadUrl } from '@/lib/storage-server';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg'
];

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!['MASTER', 'ADMIN_A', 'ADMIN_B', 'ADMIN_C'].includes(user.role)) {
       return NextResponse.json({ success: false, error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const { filename, contentType, size, projectId, documentType } = await req.json();

    if (!filename || !contentType || !size || !documentType) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    if (size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Only PDF, Excel, Word, and Images are allowed.' }, { status: 400 });
    }

    let projectCode: string | undefined = undefined;
    if (projectId) {
      const { default: prisma } = await import('@/lib/db');
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });
      if (project) {
        projectCode = project.code;
      }
    }

    // Preserve original filename but prevent path traversal
    const sanitizedFilename = filename.replace(/[\\/]/g, '_');
    
    // Generate secure unique storage path using project code
    const prefix = projectCode ? `projects/${projectCode}` : 'general';
    const timestamp = Date.now();
    const storageKey = `${prefix}/${timestamp}_${sanitizedFilename}`;

    const { signedUrl, token, path } = await getSignedUploadUrl(storageKey);

    return NextResponse.json({ 
      success: true, 
      data: {
        signedUrl,
        token,
        storageKey: path, // Use the path returned by Supabase
        sanitizedFilename,
      } 
    });
  } catch (error: any) {
    console.error('Upload URL generation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate upload URL.' }, { status: 500 });
  }
}
