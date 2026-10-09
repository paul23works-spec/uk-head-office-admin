import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import prisma from '@/lib/db';
import { deleteFromStorage } from '@/lib/storage-server';

interface RouteParams {
  params: Promise<{ id: string, attachmentId: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id, attachmentId } = await params;
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

    // Get revision from URL query param
    const url = new URL(req.url);
    const revisionStr = url.searchParams.get('revision');

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

    const attachment = await prisma.draftAttachment.findUnique({
      where: { id: attachmentId }
    });

    if (!attachment || attachment.draftId !== draft.id) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Attempt to delete from storage first
    try {
      await deleteFromStorage(attachment.storageKey);
    } catch (e) {
      console.error(`Failed to delete from storage for key ${attachment.storageKey}`, e);
      // Continue anyway to maintain DB consistency
    }

    // DB Update
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

      await tx.draftAttachment.delete({
        where: { id: attachmentId }
      });

      const updatedDraft = await tx.draft.findUnique({ where: { id: draft.id } });
      return updatedDraft;
    });

    return NextResponse.json({ success: true, revision: result?.revision });
  } catch (error: any) {
    console.error('Error deleting draft attachment:', error);
    if (error.message === 'CONCURRENCY_CONFLICT') {
      return NextResponse.json({ error: 'Conflict: Draft has been modified' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
