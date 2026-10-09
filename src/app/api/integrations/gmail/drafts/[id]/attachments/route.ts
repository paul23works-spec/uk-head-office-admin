import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import prisma from '@/lib/db';
import { uploadToStorage } from '@/lib/storage-server';
import crypto from 'crypto';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getServerUser();
    if (!user || !user.employeeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employee = await prisma.employee.findUnique({
      where: { employeeId: user.employeeId },
      select: { id: true },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const revisionStr = formData.get('revision') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!revisionStr) {
      return NextResponse.json({ error: 'Missing revision' }, { status: 400 });
    }

    const revision = parseInt(revisionStr, 10);
    if (isNaN(revision)) {
      return NextResponse.json({ error: 'Invalid revision' }, { status: 400 });
    }

    const draft = await prisma.draft.findFirst({
      where: { id, employeeId: employee.id }
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    if (draft.status !== 'DRAFT') {
      return NextResponse.json({ error: `Draft is ${draft.status} and cannot be edited` }, { status: 403 });
    }

    if (draft.revision !== revision) {
      return NextResponse.json({ error: 'Conflict: Draft has been modified' }, { status: 409 });
    }

    // Limit to 25MB
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 25MB limit' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageKey = `draft-attachments/${employee.id}/${draft.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    await uploadToStorage(storageKey, buffer, file.type || 'application/octet-stream');

    // Perform DB update within a transaction to maintain integrity
    const result = await prisma.$transaction(async (tx) => {
      // Optimistic concurrency check
      const updateResult = await tx.draft.updateMany({
        where: {
          id: draft.id,
          revision: revision
        },
        data: {
          revision: { increment: 1 }
        }
      });

      if (updateResult.count === 0) {
        throw new Error('CONCURRENCY_CONFLICT');
      }

      const att = await tx.draftAttachment.create({
        data: {
          draftId: draft.id,
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          storageKey: storageKey
        }
      });

      // Fetch the updated draft to return the new revision
      const updatedDraft = await tx.draft.findUnique({ where: { id: draft.id } });
      
      return { updatedDraft, att };
    });

    return NextResponse.json({ success: true, attachment: result.att, revision: result.updatedDraft?.revision });
  } catch (error: any) {
    console.error('Error uploading draft attachment:', error);
    if (error.message === 'CONCURRENCY_CONFLICT') {
      return NextResponse.json({ error: 'Conflict: Draft has been modified' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
