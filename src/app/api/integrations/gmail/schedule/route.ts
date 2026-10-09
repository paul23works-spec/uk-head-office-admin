import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import prisma from '@/lib/db';
import { uploadToStorage, deleteFromStorage } from '@/lib/storage-server';
import { GmailService } from '@/lib/services/gmail.service';

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
    const scheduledAtStr = formData.get('scheduledAt') as string || '';

    if (!to || !scheduledAtStr) {
      return NextResponse.json({ error: 'Missing required field: to or scheduledAt' }, { status: 400 });
    }

    const scheduledAt = new Date(scheduledAtStr);
    if (isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      return NextResponse.json({ error: 'Invalid scheduled time. Must be in the future.' }, { status: 400 });
    }

    const attachmentsMeta: Array<{ filename: string; mimeType: string; storageKey: string }> = [];
    let totalSize = 0;
    
    for (const [key, value] of formData.entries()) {
      if (key === 'attachments' && typeof value === 'object' && value !== null && 'arrayBuffer' in value) {
        const file = value as File;
        if (file.size > 20 * 1024 * 1024) {
          return NextResponse.json({ error: `File ${file.name} is too large. Limit is 20MB.` }, { status: 400 });
        }
        totalSize += value.size;
        
        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type || 'application/octet-stream';
        const storageKey = `scheduled-emails/${employee.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        await uploadToStorage(storageKey, buffer, mimeType);
        
        attachmentsMeta.push({
          filename: file.name,
          mimeType,
          storageKey
        });
      }
    }
    
    if (totalSize > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Total attachment size exceeds 25MB limit.' }, { status: 400 });
    }

    const scheduledEmail = await prisma.scheduledEmail.create({
      data: {
        employeeId: employee.id,
        to,
        cc,
        bcc,
        subject,
        textBody,
        htmlBody,
        scheduledAt,
        attachments: attachmentsMeta.length ? attachmentsMeta : undefined
      }
    });

    return NextResponse.json(scheduledEmail);
  } catch (error: unknown) {
    console.error('Error creating scheduled email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const emails = await prisma.scheduledEmail.findMany({
      where: { employeeId: employee.id },
      orderBy: { scheduledAt: 'asc' }
    });

    return NextResponse.json({ emails });
  } catch (error: unknown) {
    console.error('Error fetching scheduled emails:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const email = await prisma.scheduledEmail.findUnique({
      where: { id }
    });

    if (!email) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (email.employeeId !== employee.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (email.status !== 'SCHEDULED') {
      return NextResponse.json({ error: 'Cannot cancel an email that is already processed or sent' }, { status: 400 });
    }

    const updated = await prisma.scheduledEmail.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    // Cleanup attachments from storage
    if (email.attachments) {
      const attachmentsMeta = typeof email.attachments === 'string'
        ? JSON.parse(email.attachments)
        : email.attachments as Array<{ storageKey?: string }>;
        
      let updatedMeta = [];
      let changed = false;

      for (const meta of attachmentsMeta) {
        if (meta.storageKey) {
          try {
            await deleteFromStorage(meta.storageKey);
            const { storageKey, ...rest } = meta;
            updatedMeta.push(rest);
            changed = true;
          } catch (delErr) {
            console.error(`Failed to delete storage attachment ${meta.storageKey}:`, delErr);
            updatedMeta.push(meta); // Keep storageKey to retry later via reconciliation
          }
        } else {
          updatedMeta.push(meta);
        }
      }

      if (changed) {
        await prisma.scheduledEmail.update({
          where: { id },
          data: { attachments: updatedMeta }
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error('Error canceling scheduled email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
