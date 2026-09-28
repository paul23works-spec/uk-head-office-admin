import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { NotificationChannel } from '@prisma/client';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

// Environment variables might not be present during Next.js static build phase
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const body = await req.json();
    
    // Pub/Sub messages wrap data in body.message.data (base64 encoded)
    if (!body.message || !body.message.data) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const payloadString = Buffer.from(body.message.data, 'base64').toString('utf-8');
    const emailData = JSON.parse(payloadString);

    const emailAddress = emailData.emailAddress;
    const historyId = emailData.historyId;

    if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
      // Degrade gracefully if credentials are not configured.
      console.warn('Gmail API credentials not configured. Webhook received but cannot fetch email payload.');
      return NextResponse.json({ success: true, warning: 'Credentials missing' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Fetch history to get the new messages
    const historyRes = await gmail.users.history.list({
      userId: emailAddress,
      startHistoryId: historyId,
    });

    const histories = historyRes.data.history;
    if (!histories) {
      return NextResponse.json({ success: true, message: 'No new history' });
    }

    for (const history of histories) {
      if (history.messagesAdded) {
        for (const msgAdded of history.messagesAdded) {
          const messageId = msgAdded.message?.id;
          if (!messageId) continue;

          // Check for duplication
          const existingLog = await prisma.communicationLog.findFirst({
            where: { externalId: messageId }
          });
          if (existingLog) continue;

          // Fetch full message
          const msg = await gmail.users.messages.get({
            userId: emailAddress,
            id: messageId,
            format: 'full',
          });

          const headers = msg.data.payload?.headers || [];
          const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject');
          const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from');
          const toHeader = headers.find(h => h.name?.toLowerCase() === 'to');

          const subject = subjectHeader?.value || 'No Subject';
          const from = fromHeader?.value || 'unknown';
          const to = toHeader?.value || emailAddress;

          // Try to extract project code from subject (e.g. [PROJ-1024])
          const projectMatch = subject.match(/\[([A-Z0-9-]+)\]/);
          let projectId = null;
          if (projectMatch) {
            const code = projectMatch[1];
            const project = await prisma.project.findUnique({ where: { code } });
            if (project) {
              projectId = project.id;
            }
          }

          // Basic body extraction (text/plain preferred)
          let bodyText = '';
          const parts = msg.data.payload?.parts || [];
          const textPart = parts.find(p => p.mimeType === 'text/plain');
          if (textPart && textPart.body?.data) {
            bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
          } else if (msg.data.snippet) {
            bodyText = msg.data.snippet;
          }

          const inboundLog = await prisma.communicationLog.create({
            data: {
              channel: NotificationChannel.EMAIL,
              direction: 'INBOUND',
              from: from,
              to: to,
              subject: subject,
              body: bodyText,
              status: 'RECEIVED',
              externalId: messageId,
              projectId: projectId,
            }
          });

          // Handle attachments
          for (const part of parts) {
            if (part.filename && part.body?.attachmentId) {
              const attachment = await gmail.users.messages.attachments.get({
                userId: emailAddress,
                messageId: messageId,
                id: part.body.attachmentId,
              });

              if (attachment.data.data) {
                const buffer = Buffer.from(attachment.data.data, 'base64');
                const fileExt = part.filename.split('.').pop() || 'bin';
                const storageKey = `inbound/${Date.now()}-${messageId}.${fileExt}`;
                
                if (supabaseAdmin) {
                  await supabaseAdmin.storage
                    .from('uk enterprise document')
                    .upload(storageKey, buffer, {
                      contentType: part.mimeType || 'application/octet-stream',
                    });

                  // Create document record if pdf/image
                  if (part.mimeType === 'application/pdf' || part.mimeType?.startsWith('image/')) {
                    await prisma.document.create({
                      data: {
                        filename: part.filename,
                        documentType: 'INBOUND_ATTACHMENT',
                        storageKey: storageKey,
                        uploadedBy: 'SYSTEM_GMAIL',
                        projectId: projectId,
                        processingStatus: 'PENDING',
                      }
                    });
                  }
                } else {
                  console.warn('Supabase Admin client not initialized, skipping attachment upload.');
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Gmail webhook:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
