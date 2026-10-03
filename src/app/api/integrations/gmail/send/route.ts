import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import { GmailService } from '@/lib/services/gmail.service';
import prisma from '@/lib/db';

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

    const formData = await req.formData();
    const to = formData.get('to') as string || '';
    const cc = formData.get('cc') as string || '';
    const bcc = formData.get('bcc') as string || '';
    const subject = formData.get('subject') as string || '';
    const textBody = formData.get('textBody') as string || '';
    const htmlBody = formData.get('htmlBody') as string || '';

    if (!to) {
      return NextResponse.json({ error: 'Missing required field: to' }, { status: 400 });
    }

    const attachments: Array<{ filename: string; mimeType: string; data: Buffer }> = [];
    let totalSize = 0;
    
    for (const [key, value] of formData.entries()) {
      if (key === 'attachments' && typeof value === 'object' && value !== null && 'arrayBuffer' in value) {
        const file = value as File;
        if (file.size > 20 * 1024 * 1024) { // 20 MB limit per file roughly
          return NextResponse.json({ error: `File ${file.name} is too large. Limit is 20MB.` }, { status: 400 });
        }
        totalSize += value.size;
        
        const buffer = Buffer.from(await file.arrayBuffer());
        attachments.push({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          data: buffer
        });
      }
    }
    
    if (totalSize > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Total attachment size exceeds 25MB limit.' }, { status: 400 });
    }

    const result = await GmailService.sendMessage(
      employee.id,
      to,
      cc,
      bcc,
      subject,
      textBody,
      htmlBody,
      attachments
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'GMAIL_NOT_CONNECTED' || error.message === 'GMAIL_AUTH_FAILED')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Error sending Gmail message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
