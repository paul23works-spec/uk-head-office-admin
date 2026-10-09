import { test, expect } from '@playwright/test';
import prisma from '../../src/lib/db';
import { google } from 'googleapis';

test.describe('Phase 7 Final Two-Point Verification', () => {
  test('Verify Forward Attachment and Reply All Isolation', async ({ page, request }) => {
    test.setTimeout(120000);

    // Login via UI to get cookies
    console.log('Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.locator('button').filter({ hasText: 'MASTER' }).click();
    await page.waitForURL('**/');

    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    // Get inbox messages
    console.log('Fetching recent sent/received messages...');
    const listResp = await request.get('http://localhost:3000/api/integrations/gmail/messages?labelIds=SENT', {
      headers: { Cookie: cookieHeader }
    });
    const listData = await listResp.json();
    const messages = listData.messages || [];

    // Find Forwarded Email and Reply All Email
    let fwdMessageId = null;
    let replyAllMessageId = null;
    const authUserEmail = 'paul23works@gmail.com';

    for (const msg of messages) {
      const msgResp = await request.get(`http://localhost:3000/api/integrations/gmail/messages/${msg.id}`, {
        headers: { Cookie: cookieHeader }
      });
      const msgData = await msgResp.json();
      const subjectHeader = msgData.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '';
      
      if (subjectHeader.startsWith('Fwd: Test Real System Phase 7')) {
        fwdMessageId = msg.id;
      }
      if (subjectHeader.startsWith('Re: Test Real System Phase 7')) {
        // Just take the first one or the last one, both show isolation
        replyAllMessageId = msg.id;
      }

      if (fwdMessageId && replyAllMessageId) break;
    }

    if (!fwdMessageId) throw new Error('Could not find forwarded message');
    if (!replyAllMessageId) throw new Error('Could not find reply all message');

    console.log('Found Fwd ID:', fwdMessageId);
    console.log('Found ReplyAll ID:', replyAllMessageId);

    // 1. FORWARDED ATTACHMENT INTEGRITY
    console.log('\n--- VERIFYING FORWARDED ATTACHMENT INTEGRITY ---');
    const fwdResp = await request.get(`http://localhost:3000/api/integrations/gmail/messages/${fwdMessageId}`, {
      headers: { Cookie: cookieHeader }
    });
    const fwdData = await fwdResp.json();

    let attachmentId = null;
    let attachmentFilename = null;
    let attachmentMime = null;

    const findAttachment = (parts: any[]) => {
      for (const part of parts) {
        if (part.filename && part.body?.attachmentId) {
          attachmentId = part.body.attachmentId;
          attachmentFilename = part.filename;
          attachmentMime = part.mimeType;
          return;
        }
        if (part.parts) {
          findAttachment(part.parts);
        }
      }
    };

    if (fwdData.payload?.parts) {
      findAttachment(fwdData.payload.parts);
    }

    if (!attachmentId) throw new Error('No attachment found in forwarded message parts');

    console.log(`Found attachment: ${attachmentFilename} (${attachmentMime})`);
    
    const connection = await prisma.gmailConnection.findFirst();
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/gmail/callback`
    );
    oauth2Client.setCredentials({ refresh_token: connection!.encryptedToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const attData = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: fwdMessageId,
      id: attachmentId
    });
    
    const base64Data = attData.data.data!.replace(/-/g, '+').replace(/_/g, '/');
    const buffer = Buffer.from(base64Data, 'base64');
    
    expect(buffer.length).toBeGreaterThan(0);
    console.log(`Attachment downloaded size: ${buffer.length} bytes`);
    console.log(`Attachment contents: ${buffer.toString('utf8').substring(0, 50)}...`);
    console.log('FORWARDED ATTACHMENT INTEGRITY: PASS');

    // 2. REPLY ALL RECIPIENT ISOLATION
    console.log('\n--- VERIFYING REPLY ALL RECIPIENT ISOLATION ---');
    const replyResp = await request.get(`http://localhost:3000/api/integrations/gmail/messages/${replyAllMessageId}`, {
      headers: { Cookie: cookieHeader }
    });
    const replyData = await replyResp.json();

    const toHeader = replyData.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'to')?.value || '';
    const ccHeader = replyData.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'cc')?.value || '';
    
    console.log('To Header:', toHeader);
    console.log('CC Header:', ccHeader);

    const parseAddresses = (header: string) => header.split(',').map(s => {
      const match = s.match(/<([^>]+)>/);
      return match ? match[1].trim().toLowerCase() : s.trim().toLowerCase();
    }).filter(Boolean);

    const toAddresses = parseAddresses(toHeader);
    const ccAddresses = parseAddresses(ccHeader);
    const allAddresses = [...toAddresses, ...ccAddresses];

    console.log('Parsed Recipients:', allAddresses);

    // Verify isolation
    expect(allAddresses.includes(authUserEmail.toLowerCase())).toBe(false);
    
    const uniqueAddresses = new Set(allAddresses);
    expect(uniqueAddresses.size).toBe(allAddresses.length);

    console.log('REPLY ALL RECIPIENT ISOLATION: PASS');
  });
});
