import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import prisma from '@/lib/db';
import { GmailService } from '@/lib/services/gmail.service';
import { deleteFromStorage } from '@/lib/storage-server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
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

    const draft = await prisma.draft.findFirst({
      where: {
        id,
        employeeId: employee.id,
      },
      include: {
        attachments: true
      }
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
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

    const body = await req.json();

    if (typeof body.revision !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid revision' }, { status: 400 });
    }

    let to, cc, bcc;
    try {
      to = GmailService.validateEmailHeader(body.to || '', 'to');
      cc = GmailService.validateEmailHeader(body.cc || '', 'cc');
      bcc = GmailService.validateEmailHeader(body.bcc || '', 'bcc');
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    if (body.htmlBody && body.htmlBody.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 400 });
    }

    const currentDraft = await prisma.draft.findFirst({
      where: { id, employeeId: employee.id }
    });

    if (!currentDraft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    if (currentDraft.status !== 'DRAFT') {
      return NextResponse.json({ error: `Draft is ${currentDraft.status} and cannot be edited` }, { status: 403 });
    }

    if (currentDraft.revision !== body.revision) {
      return NextResponse.json({ error: 'Conflict: Draft has been modified' }, { status: 409 });
    }

    try {
      const updatedDraft = await prisma.draft.update({
        where: {
          id,
        },
        data: {
          to,
          cc,
          bcc,
          subject: body.subject || '',
          htmlBody: body.htmlBody || '',
          textBody: body.textBody || '',
          threadId: body.threadId,
          inReplyTo: body.inReplyTo,
          references: body.references,
          isReplyAll: !!body.isReplyAll,
          forwardedMessageId: body.forwardedMessageId,
          revision: {
            increment: 1
          }
        }
      });

      return NextResponse.json({ success: true, draft: updatedDraft, revision: updatedDraft.revision });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Conflict: Draft has been modified or does not exist' }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating draft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

    const currentDraft = await prisma.draft.findFirst({
      where: { id, employeeId: employee.id },
      include: { attachments: true }
    });

    if (!currentDraft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    await prisma.draft.delete({
      where: { id }
    });

    for (const attachment of currentDraft.attachments) {
      try {
        await deleteFromStorage(attachment.storageKey);
      } catch (err) {
        console.error('Failed to cleanup storage for deleted draft attachment', attachment.storageKey, err);
      }
    }

    return NextResponse.json({ 
      success: true,
      deletedId: id
    });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
