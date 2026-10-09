import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import prisma from '@/lib/db';
import { GmailService } from '@/lib/services/gmail.service';

export async function GET(req: NextRequest) {
  try {
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

    const drafts = await prisma.draft.findMany({
      where: {
        employeeId: employee.id,
        status: 'DRAFT',
      },
      include: {
        attachments: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({ drafts });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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

    const draft = await prisma.draft.create({
      data: {
        employeeId: employee.id,
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
        status: 'DRAFT',
        revision: 0
      }
    });

    return NextResponse.json({ success: true, draft, revision: draft.revision });
  } catch (error) {
    console.error('Error creating draft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
