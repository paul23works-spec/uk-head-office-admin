import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import { DocumentService } from '@/lib/services/document.service';
import { uploadToStorage } from '@/lib/storage-server';
import { DocumentIntelligenceService } from '@/lib/services/document-intelligence.service';

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
  return NextResponse.json({ 
    success: false, 
    error: 'Direct FormData uploads are disabled due to Vercel payload limits. Use /api/documents/upload-url to upload directly to Supabase.' 
  }, { status: 405 });
}

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId') || undefined;

    const documents = await DocumentService.getDocuments(projectId);

    return NextResponse.json({ success: true, data: documents });
  } catch (error: any) {
    console.error('Document fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch documents.' }, { status: 500 });
  }
}
