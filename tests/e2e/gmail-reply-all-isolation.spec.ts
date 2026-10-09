import { test, expect } from '@playwright/test';

test.describe('Phase 7: Gmail Reply All Recipient Isolation', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate
    await page.goto('http://localhost:3000/login');
    await page.locator('button').filter({ hasText: 'MASTER' }).click();
    await page.waitForURL('**/');
  });

  const setupMockMessage = async (page: any, from: string, to: string, cc: string) => {
    await page.route('**/api/integrations/gmail/messages?label=INBOX', async (route: any) => {
      await route.fulfill({
        status: 200,
        json: {
          messages: [{
            id: 'mock-msg-1',
            threadId: 'mock-thread-1',
            subject: 'Re: Test',
            from,
            to,
            date: new Date().toISOString(),
            snippet: 'Snippet',
            isUnread: false,
            isStarred: false
          }],
          emailAddress: 'paul23works@gmail.com'
        }
      });
    });

    await page.route('**/api/integrations/gmail/messages/mock-msg-1', async (route: any) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 'mock-msg-1',
          threadId: 'mock-thread-1',
          subject: 'Re: Test',
          from,
          to,
          date: new Date().toISOString(),
          snippet: 'Snippet',
          isUnread: false,
          isStarred: false,
          payload: {
            mimeType: 'text/plain',
            headers: [
              { name: 'From', value: from },
              { name: 'To', value: to },
              { name: 'Cc', value: cc },
              { name: 'Message-ID', value: '<msg-1@test>' }
            ],
            body: { data: Buffer.from('Body').toString('base64') }
          }
        }
      });
    });

    await page.goto('http://localhost:3000/management/communications/gmail');
    await page.waitForSelector('.flex.items-center.gap-4.p-4', { state: 'visible' });
    const firstMessage = page.locator('.flex.items-center.gap-4.p-4').first();
    await firstMessage.click();
    await page.waitForSelector('.prose', { state: 'visible' });
    await page.locator('button[title="Reply All"]').click();
    await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible();
  };

  test('A. Sender is current user', async ({ page }) => {
    await setupMockMessage(page, 'Paul <paul23works@gmail.com>', 'Other <other@example.com>', '');
    const toInput = page.locator('input[placeholder="recipient@example.com"]');
    const toValue = await toInput.inputValue();
    expect(toValue).not.toContain('paul23works');
    expect(toValue).toContain('other@example.com');
  });

  test('B. Current user appears in original To', async ({ page }) => {
    await setupMockMessage(page, 'Sender <sender@example.com>', 'Paul <paul23works@gmail.com>, Other <other@example.com>', '');
    const toInput = page.locator('input[placeholder="recipient@example.com"]');
    const toValue = await toInput.inputValue();
    expect(toValue).not.toContain('paul23works');
    expect(toValue).toContain('sender@example.com');
    expect(toValue).toContain('Other <other@example.com>');
  });

  test('C. Current user appears in original CC', async ({ page }) => {
    await setupMockMessage(page, 'Sender <sender@example.com>', 'Other <other@example.com>', 'Paul <paul23works@gmail.com>, third@example.com');
    const toInput = page.locator('input[placeholder="recipient@example.com"]');
    const ccInput = page.locator('input[type="text"]').nth(1); // Second text input is CC
    const ccValue = await ccInput.inputValue();
    expect(ccValue).not.toContain('paul23works');
    expect(ccValue).toContain('third@example.com');
  });

  test('D & E. Case variation and RFC 5322 display-name format', async ({ page }) => {
    await setupMockMessage(page, 'Paul23Works@gmail.com', '"Paul" <PAUL23WORKS@GMAIL.COM>, paul23works@GMAIL.com', '');
    const toInput = page.locator('input[placeholder="recipient@example.com"]');
    const toValue = await toInput.inputValue();
    expect(toValue).toBe('');
  });

  test('F. Duplicate recipients', async ({ page }) => {
    await setupMockMessage(page, 'Sender <sender@example.com>', 'Sender <sender@example.com>, other@example.com, OTHER@example.com', 'other@example.com');
    const toInput = page.locator('input[placeholder="recipient@example.com"]');
    const ccInput = page.locator('input[type="text"]').nth(1);
    const toValue = await toInput.inputValue();
    const ccValue = await ccInput.inputValue();
    // sender@example.com should be there exactly once. other@example.com should be there exactly once.
    expect(toValue).toBe('Sender <sender@example.com>, other@example.com');
    expect(ccValue).toBe('');
  });

  test('G. Normal Compose regression', async ({ page }) => {
    await page.goto('http://localhost:3000/management/communications/gmail');
    await page.locator('button:has-text("Compose")').click();
    await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible();
    
    // Attempting to send to own email should be allowed
    await page.locator('input[placeholder="recipient@example.com"]').fill('paul23works@gmail.com');
    await page.locator('input[type="text"]').nth(3).fill('Test Send to Self');
    
    // We are just verifying it allows typing in the UI without stripping it immediately.
    // The server test below handles actual routing
    const toValue = await page.locator('input[placeholder="recipient@example.com"]').inputValue();
    expect(toValue).toBe('paul23works@gmail.com');
  });

  test('H. Server bypass test', async ({ request }) => {
    // We will directly call the server route with isReplyAll=true and attempt to bypass
    // We need to login first to get the cookie
    const loginResp = await request.post('http://localhost:3000/api/auth', {
      data: { employeeId: 'EMP-001', password: 'password' } // Master user
    });
    
    expect(loginResp.ok()).toBeTruthy();

    // FormData for Reply All bypass
    const bypassTo = 'paul23works@gmail.com';
    const bypassCc = 'PAUL23WORKS@GMAIL.COM';

    const sendResp = await request.post('http://localhost:3000/api/integrations/gmail/send', {
      multipart: {
        to: bypassTo,
        cc: bypassCc,
        subject: 'Server Bypass Test',
        isReplyAll: 'true'
      }
    });
    
    // We expect it to return 400 because the To field will be empty after filtering
    expect(sendResp.status()).toBe(400);
    const result = await sendResp.json();
    expect(result.error).toContain('Missing required field: to (after reply-all filtering)');
  });
});