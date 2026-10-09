import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { GmailService } from '@/lib/services/gmail.service';
import { downloadFromStorage, deleteFromStorage } from '@/lib/storage-server';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const staleThreshold = new Date(Date.now() - 10 * 60 * 1000);

    // Safely mark stale PROCESSING jobs as DELIVERY_UNKNOWN to avoid double-sending.
    // If a job was PROCESSING for > 10m, it likely crashed. We do not retry it,
    // as it may have already been delivered before the DB update.
    await prisma.$queryRaw`
      UPDATE "ScheduledEmail"
      SET status = 'DELIVERY_UNKNOWN', error = 'Worker crashed or timed out. Delivery status is unknown.', "updatedAt" = ${now}
      WHERE status = 'PROCESSING' AND "updatedAt" <= ${staleThreshold};
    `;

    // Atomic claim: update SCHEDULED emails that are due to PROCESSING
    // Passed Date objects to prevent DB timezone drift against UTC timestamps
    const claimedEmails = await prisma.$queryRaw`
      UPDATE "ScheduledEmail"
      SET status = 'PROCESSING', "updatedAt" = ${now}
      WHERE status = 'SCHEDULED' AND "scheduledAt" <= ${now}
      RETURNING *;
    ` as any[];

    if (!claimedEmails || claimedEmails.length === 0) {
      return NextResponse.json({ message: 'No scheduled emails to process' });
    }

    const results = [];

    for (const email of claimedEmails) {
      try {
        const employee = await prisma.employee.findUnique({
          where: { id: email.employeeId }
        });

        if (!employee) {
          throw new Error('Employee not found');
        }

        const attachments = [];
        const attachmentsMeta = typeof email.attachments === 'string' 
          ? JSON.parse(email.attachments) 
          : email.attachments || [];

        for (const meta of attachmentsMeta) {
          const buffer = await downloadFromStorage(meta.storageKey);
          attachments.push({
            filename: meta.filename,
            mimeType: meta.mimeType,
            data: buffer
          });
        }

        // Send the email
        await GmailService.sendMessage(
          employee.id,
          email.to,
          email.cc || '',
          email.bcc || '',
          email.subject,
          email.textBody,
          email.htmlBody || '',
          attachments
        );

        // Update status to SENT
        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data: { 
            status: 'SENT',
            sentAt: new Date()
          }
        });
        // Cleanup is now handled by the reconciliation phase below
        results.push({ id: email.id, status: 'SENT' });
      } catch (err: any) {
        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data: { 
            status: 'FAILED',
            error: err.message || 'Unknown error during execution'
          }
        });
        results.push({ id: email.id, status: 'FAILED', error: err.message });
      }
    }

    // ==========================================
    // ORPHAN RECONCILIATION PHASE
    // ==========================================
    const orphanCandidates = await prisma.scheduledEmail.findMany({
      where: {
        status: {
          in: ['SENT', 'CANCELLED', 'DELIVERY_UNKNOWN']
        },
        attachments: {
          not: null as any
        }
      },
      take: 100 // Process in batches
    });

    for (const email of orphanCandidates) {
      if (!email.attachments) continue;
      
      const attachmentsMeta = typeof email.attachments === 'string' 
        ? JSON.parse(email.attachments) 
        : email.attachments;
        
      if (!Array.isArray(attachmentsMeta) || attachmentsMeta.length === 0) continue;
      
      const hasStorageKeys = attachmentsMeta.some(m => !!m.storageKey);
      if (!hasStorageKeys) continue; // Already fully cleaned
      
      let updatedMeta = [];
      let changed = false;

      for (const meta of attachmentsMeta) {
        if (meta.storageKey) {
          try {
            await deleteFromStorage(meta.storageKey);
            // On success, omit storageKey
            const { storageKey, ...rest } = meta;
            updatedMeta.push(rest);
            changed = true;
          } catch (delErr) {
            console.error(`Reconciliation: Failed to delete attachment ${meta.storageKey} for email ${email.id}:`, delErr);
            updatedMeta.push(meta); // Keep storageKey to retry later
          }
        } else {
          updatedMeta.push(meta);
        }
      }

      if (changed) {
        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data: { attachments: updatedMeta }
        });
      }
    }

    return NextResponse.json({ processed: claimedEmails.length, results });
  } catch (error: any) {
    console.error('Error processing scheduled emails:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
