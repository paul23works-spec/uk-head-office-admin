import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import { GmailService } from '@/lib/services/gmail.service';
import prisma from '@/lib/db';
import { downloadFromStorage, deleteFromStorage } from '@/lib/storage-server';

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
    
    let to, cc, bcc;
    try {
      to = GmailService.validateEmailHeader(formData.get('to') as string || '', 'to');
      cc = GmailService.validateEmailHeader(formData.get('cc') as string || '', 'cc');
      bcc = GmailService.validateEmailHeader(formData.get('bcc') as string || '', 'bcc');
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    const subject = formData.get('subject') as string || '';
    const textBody = formData.get('textBody') as string || '';
    const htmlBody = formData.get('htmlBody') as string || '';

    if (!to) {
      return NextResponse.json({ error: 'Missing required field: to' }, { status: 400 });
    }

    const isReplyAll = formData.get('isReplyAll') === 'true';
    if (isReplyAll) {
      const connection = await prisma.gmailConnection.findUnique({
        where: { employeeId: employee.id }
      });
      
      if (!connection || !connection.emailAddress) {
        return NextResponse.json({ error: 'GMAIL_NOT_CONNECTED' }, { status: 401 });
      }

      const currentUserEmail = connection.emailAddress.trim().toLowerCase();
      const extractEmailAddress = (addr: string) => {
        const match = addr.match(/<([^>]+)>/);
        return match ? match[1].trim().toLowerCase() : addr.trim().toLowerCase();
      };

      const filterHeader = (header: string) => {
        if (!header) return '';
        const addrs = header.split(',').map(s => s.trim()).filter(Boolean);
        const unique = new Map<string, string>();
        addrs.forEach(addr => {
          const lower = extractEmailAddress(addr);
          if (lower !== currentUserEmail && !unique.has(lower)) {
            unique.set(lower, addr);
          }
        });
        return Array.from(unique.values()).join(', ');
      };

      to = filterHeader(to);
      cc = filterHeader(cc);
      bcc = filterHeader(bcc);

      if (!to) {
        return NextResponse.json({ error: 'Missing required field: to (after reply-all filtering)' }, { status: 400 });
      }
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

    const threadId = formData.get('threadId') as string | undefined;
    const inReplyTo = formData.get('inReplyTo') as string | undefined;
    const references = formData.get('references') as string | undefined;
    const forwardedMessageId = formData.get('forwardedMessageId') as string | undefined;
    const draftId = formData.get('draftId') as string | undefined;

    const storageKeysToDelete: string[] = [];

    if (draftId) {
      const draft = await prisma.draft.findFirst({
        where: { id: draftId, employeeId: employee.id },
        include: { attachments: true }
      });
      
      if (draft && draft.attachments) {
        for (const att of draft.attachments) {
          totalSize += att.size;
          if (totalSize > 25 * 1024 * 1024) {
            return NextResponse.json({ error: 'Total attachment size exceeds 25MB limit.' }, { status: 400 });
          }
          try {
            const buffer = await downloadFromStorage(att.storageKey);
            attachments.push({
              filename: att.filename,
              mimeType: att.mimeType,
              data: buffer
            });
            storageKeysToDelete.push(att.storageKey);
          } catch (err) {
            console.error('Failed to download draft attachment:', err);
            return NextResponse.json({ error: 'Failed to retrieve attachments' }, { status: 500 });
          }
        }
      }
    }

    const result = await GmailService.sendMessage(
      employee.id,
      to,
      cc,
      bcc,
      subject,
      textBody,
      htmlBody,
      attachments,
      { threadId, inReplyTo, references, forwardedMessageId }
    );

    // Cleanup draft and storage
    if (draftId) {
      try {
        await prisma.draft.delete({ where: { id: draftId } });
        for (const key of storageKeysToDelete) {
          try {
            await deleteFromStorage(key);
          } catch (e) {
            console.error('Failed to cleanup storage key', key, e);
          }
        }
      } catch (err) {
        console.error('Failed to cleanup draft', err);
      }
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'GMAIL_NOT_CONNECTED' || error.message === 'GMAIL_AUTH_FAILED')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Error sending Gmail message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
