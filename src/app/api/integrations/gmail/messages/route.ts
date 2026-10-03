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

    const result = await GmailService.listMessages(employee.id, pageToken);

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'GMAIL_NOT_CONNECTED' || error.message === 'GMAIL_AUTH_FAILED')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Error fetching Gmail messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
