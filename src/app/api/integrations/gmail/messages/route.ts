import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import { GmailService } from '@/lib/services/gmail.service';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get('pageToken') || undefined;
    const label = searchParams.get('label') || 'INBOX';

    let result;
    if (label === 'DRAFTS') {
      const dbDrafts = await prisma.draft.findMany({
        where: { employeeId: employee.id },
        orderBy: { updatedAt: 'desc' },
        take: 25,
      });
      result = {
        messages: dbDrafts.map((d: any) => ({
          id: d.id, // This is a draft ID
          draft: { id: d.id }, // So handleOpenDraft can access msg.draft.id or msg.id
          threadId: d.threadId || '',
          snippet: (d.textBody || d.htmlBody || '').replace(/<[^>]+>/g, '').substring(0, 100),
          labelIds: ['DRAFTS'],
          from: '',
          to: d.to || '',
          subject: d.subject || '',
          date: d.updatedAt.toISOString(),
          isUnread: false,
          isStarred: false,
        })),
        nextPageToken: null,
      };
    } else {
      result = await GmailService.listMessages(employee.id, pageToken, 25, label);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'GMAIL_NOT_CONNECTED' || error.message === 'GMAIL_AUTH_FAILED')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Error fetching Gmail messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
