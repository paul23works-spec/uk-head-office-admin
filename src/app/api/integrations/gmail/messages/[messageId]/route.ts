import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import { GmailService } from '@/lib/services/gmail.service';
import prisma from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
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

    const resolvedParams = await params;
    const message = await GmailService.getMessage(employee.id, resolvedParams.messageId);

    return NextResponse.json(message);
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'GMAIL_NOT_CONNECTED' || error.message === 'GMAIL_AUTH_FAILED')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Error fetching Gmail message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
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

    const body = await request.json();
    const { action } = body;
    const resolvedParams = await params;

    let result;
    if (action === 'read') {
      result = await GmailService.modifyMessage(employee.id, resolvedParams.messageId, [], ['UNREAD']);
    } else if (action === 'unread') {
      result = await GmailService.modifyMessage(employee.id, resolvedParams.messageId, ['UNREAD'], []);
    } else if (action === 'star') {
      result = await GmailService.modifyMessage(employee.id, resolvedParams.messageId, ['STARRED'], []);
    } else if (action === 'unstar') {
      result = await GmailService.modifyMessage(employee.id, resolvedParams.messageId, [], ['STARRED']);
    } else if (action === 'archive') {
      result = await GmailService.modifyMessage(employee.id, resolvedParams.messageId, [], ['INBOX']);
    } else if (action === 'trash') {
      result = await GmailService.trashMessage(employee.id, resolvedParams.messageId);
    } else if (action === 'untrash' || action === 'restore') {
      result = await GmailService.untrashMessage(employee.id, resolvedParams.messageId);
    } else if (action === 'delete_permanently') {
      result = await GmailService.deleteMessage(employee.id, resolvedParams.messageId);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'GMAIL_NOT_CONNECTED' || error.message === 'GMAIL_AUTH_FAILED')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Error modifying Gmail message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
