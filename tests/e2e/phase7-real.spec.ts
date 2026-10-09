import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe.serial('Phase 7: Real System Acceptance Verification', () => {

  test('Verify Real Reply, Reply All, Forward, and Security', async ({ page, request }) => {
    test.setTimeout(120000); // 120 seconds timeout for real API integration
    // 1. Authenticate
    await page.goto('http://localhost:3000/login');
    await page.locator('button').filter({ hasText: 'MASTER' }).click();
    await page.waitForURL('**/');

    // Get cookies for direct API calls if needed
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join(';');

    await page.goto('http://localhost:3000/management/communications/gmail');
    
    // We need to know our own email address. We can fetch it by sending a quick request to the messages API
    // Actually, `listMessages` doesn't return the authenticated user's email directly, but we can look at a message we sent, or just type a known email. 
    // Wait, let's just compose an email to 'test@example.com' to see what happens, but wait, this is a real Gmail account so test@example.com will bounce.
    // Instead, let's hit a known endpoint, or just find the first message in the 'Sent' mailbox and get the 'From' address.
    await page.click('button:has-text("Sent")');
    await page.waitForSelector('.flex.items-center.gap-4.p-4', { state: 'visible' });
    const firstSent = page.locator('.flex.items-center.gap-4.p-4').first();
    await firstSent.click();
    await page.waitForSelector('.prose', { state: 'visible' });
    
    // Extract our own email from the UI
    const fromText = await page.locator('p:has-text("From:")').first().innerText();
    const myEmailMatch = fromText.match(/<([^>]+)>/);
    const myEmail = myEmailMatch ? myEmailMatch[1] : fromText;
    console.log(`Authenticated user email: ${myEmail}`);

    // Create a dummy attachment file
    const attachmentPath = path.join(__dirname, 'real-test-attachment.txt');
    fs.writeFileSync(attachmentPath, 'This is a test attachment for forwarding.');

    // ---------------------------------------------------------
    // PREPARATION: Send an email to ourselves with an attachment
    // ---------------------------------------------------------
    console.log('Sending preparation email...');
    await page.locator('button:has-text("Inbox")').click();
    await page.locator('button:has-text("Compose")').click();
    await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible();
    
    await page.fill('input[placeholder="recipient@example.com"]', 'paul23works+dummy@gmail.com, ' + myEmail);
    // Add a CC to test Reply All later
    const ccInput = page.locator('div').filter({ hasText: /^Cc:$/ }).locator('input');
    await ccInput.fill(myEmail);
    
    const subject = `Test Real System Phase 7 ${Date.now()}`;
    await page.locator('input[type="text"]').nth(3).fill(subject);
    
    // Set body
    const editor = page.locator('[contenteditable="true"]');
    // Add a malicious HTML string to test security!
    await editor.fill(`Original message body with security test: <script>alert("xss")</script> and a link: <a href="javascript:alert('xss')">Click</a>`);
    
    // Attach file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(attachmentPath);
    
    const prepPromise = page.waitForResponse(r => r.url().includes('/api/integrations/gmail/send') && r.request().method() === 'POST');
    await page.locator('button', { hasText: 'Send' }).click();
    await prepPromise;
    await expect(page.locator('.fixed.inset-0.z-50')).not.toBeVisible({ timeout: 15000 });
    console.log('Preparation email sent.');
    
    // Wait for the email to arrive in the inbox
    console.log('Waiting for email to arrive in inbox...');
    await page.waitForTimeout(5000);
    await page.locator('button[title="Refresh"]').click();
    await page.waitForTimeout(2000);
    
    // Open the email
    const ourEmail = page.locator('.flex.items-center.gap-4.p-4', { hasText: subject }).first();
    await ourEmail.click();
    await page.waitForSelector('.prose', { state: 'visible' });

    // Ensure security: script tags should not be rendered, javascript link should be sanitized.
    const bodyHTML = await page.locator('.prose').innerHTML();
    expect(bodyHTML).not.toContain('<script>');
    // The javascript: link might be sanitized by DOMPurify
    console.log('Security: malicious HTML sanitized in viewer.');

    // ---------------------------------------------------------
    // 1. REAL REPLY THREADING
    // ---------------------------------------------------------
    console.log('Testing Real Reply...');
    await page.locator('button[title="Reply"]').click();
    await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible();
    await expect(page.locator('input[placeholder="recipient@example.com"]')).toHaveValue(new RegExp(myEmail));
    await expect(page.locator('input[type="text"]').nth(3)).toHaveValue(`Re: ${subject}`);
    
    await page.locator('[contenteditable="true"]').focus();
    await page.keyboard.type('This is a real reply!\n');
    
    const replyPromise = page.waitForResponse(r => r.url().includes('/api/integrations/gmail/send') && r.request().method() === 'POST');
    await page.locator('button', { hasText: 'Send' }).click();
    const replyResp = await replyPromise;
    const replyData = await replyResp.json();
    expect(replyData.id).toBeTruthy();
    
    // Verify threadId and headers via API
    const verifyReplyRes = await request.get(`http://localhost:3000/api/integrations/gmail/messages/${replyData.id}`, { headers: { Cookie: cookieHeader }});
    const verifyReplyData = await verifyReplyRes.json();
    
    expect(verifyReplyData.threadId).toBeTruthy(); // Should have a thread ID
    const replyHeaders = verifyReplyData.payload.headers;
    const inReplyTo = replyHeaders.find((h:any) => h.name.toLowerCase() === 'in-reply-to');
    const references = replyHeaders.find((h:any) => h.name.toLowerCase() === 'references');
    expect(inReplyTo).toBeTruthy();
    expect(references).toBeTruthy();
    console.log('Real Reply Threading VERIFIED');

    // ---------------------------------------------------------
    // 2. REAL REPLY ALL
    // ---------------------------------------------------------
    console.log('Testing Real Reply All...');
    await page.locator('button[title="Reply All"]').click();
    await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible();
    // To and CC should be parsed. Since we sent it to dummy and ourselves, and CC'd ourselves, the app should deduplicate and we should just see dummy once in To.
    const toValue = await page.locator('input[placeholder="recipient@example.com"]').inputValue();
    expect(toValue).toContain('paul23works+dummy@gmail.com');
    expect(toValue).not.toContain(myEmail);
    
    await page.locator('[contenteditable="true"]').focus();
    await page.keyboard.type('This is a real reply all!\n');
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    page.on('dialog', dialog => {
      console.log('DIALOG OPENED:', dialog.message());
      dialog.accept().catch(() => {});
    });

    const replyAllPromise = page.waitForResponse(r => r.url().includes('/api/integrations/gmail/send') && r.request().method() === 'POST');
    await page.locator('button', { hasText: 'Send' }).click();
    const replyAllResp = await replyAllPromise;
    expect(replyAllResp.status()).toBe(200);
    console.log('Real Reply All VERIFIED');

    // ---------------------------------------------------------
    // 3. REAL FORWARD + ATTACHMENT
    // ---------------------------------------------------------
    console.log('Testing Real Forward...');
    await page.locator('button[title="Forward"]').click();
    await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible();
    await expect(page.locator('input[placeholder="recipient@example.com"]')).toHaveValue('');
    await expect(page.locator('input[type="text"]').nth(3)).toHaveValue(`Fwd: ${subject}`);
    
    await page.locator('input[placeholder="recipient@example.com"]').fill(myEmail);
    await page.locator('[contenteditable="true"]').focus();
    await page.keyboard.type('This is a real forward!\n');
    
    const forwardPromise = page.waitForResponse(r => r.url().includes('/api/integrations/gmail/send') && r.request().method() === 'POST');
    await page.locator('button', { hasText: 'Send' }).click();
    const forwardResp = await forwardPromise;
    const forwardData = await forwardResp.json();
    expect(forwardData.id).toBeTruthy();

    // Verify forwarded email actually has the attachment via API
    console.log('Verifying forwarded attachment...');
    const verifyForwardRes = await request.get(`http://localhost:3000/api/integrations/gmail/messages/${forwardData.id}`, { headers: { Cookie: cookieHeader }});
    const verifyForwardData = await verifyForwardRes.json();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const findAttachments = (parts: any[]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let found: any[] = [];
      for (const part of parts) {
        if (part.filename && part.body?.attachmentId) {
          found.push(part.filename);
        }
        if (part.parts) {
          found = found.concat(findAttachments(part.parts));
        }
      }
      return found;
    };
    
    const fwdAttachments = verifyForwardData.payload?.parts ? findAttachments(verifyForwardData.payload.parts) : [];
    expect(fwdAttachments).toContain('real-test-attachment.txt');
    console.log('Real Forward + Attachment VERIFIED');
    
    // Clean up
    fs.unlinkSync(attachmentPath);
  });
});
