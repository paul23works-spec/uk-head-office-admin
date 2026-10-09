import { test, expect } from '@playwright/test';

test('Verify Real Gmail Delivery - Full Flow', async ({ page }) => {
    // 1. Go to Login and authenticate
    await page.goto('http://localhost:3000/login');
    await page.locator('button').filter({ hasText: 'MASTER' }).click();
    await page.waitForURL('**/');
    
    // 2. Go to Gmail
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:3000/management/communications/gmail');
    await page.waitForLoadState('networkidle');

    // 3. Compose
    const composeBtn = page.getByRole('button', { name: 'Compose' });
    await expect(composeBtn).toBeVisible({ timeout: 5000 });
    await composeBtn.click({ force: true });

    // 4. To field
    const uniqueSubject = `Automated Test: Link Verification ${Date.now()}`;
    await page.locator('input[placeholder="recipient@example.com"]').fill('test@example.com');
    await page.locator('input[type="text"]').nth(3).fill(uniqueSubject);

    // 5. Editor
    const editor = page.locator('div[contenteditable="true"]');
    await editor.click();
    await editor.fill('Open Google');

    // 6. Select "Google"
    await page.evaluate(() => {
        const el = document.querySelector('div[contenteditable="true"]');
        if (!el || !el.firstChild) return;
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(el.firstChild, 5);
        range.setEnd(el.firstChild, 11);
        sel?.removeAllRanges();
        sel?.addRange(range);
    });

    // 7. Click Link - Test Javascript Rejection First
    let alertCount = 0;
    const dialogHandler = (dialog: any) => {
        if (dialog.type() === 'prompt') {
            if (alertCount === 0) dialog.accept('javascript:alert(document.domain)');
            else dialog.accept('https://www.google.com');
        } else if (dialog.type() === 'alert') {
            if (dialog.message().includes('Unsafe URL scheme detected')) {
                // Expected alert
            }
            dialog.accept();
        }
    };
    page.on('dialog', dialogHandler);
    
    // Attempt invalid link
    await page.locator('button[title="Insert Link"]').click();
    alertCount++;
    
    // Verify it was rejected (not a link)
    let editorHtml = await editor.innerHTML();
    expect(editorHtml).not.toContain('<a href="javascript:');
    
    // Attempt valid link
    await page.locator('button[title="Insert Link"]').click();

    // 8. Send
    const sendPromise = page.waitForResponse(res => res.url().includes('/api/integrations/gmail/send') && res.request().method() === 'POST');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    const sendResp = await sendPromise;
    expect(sendResp.status()).toBe(200);

    // 9. Go to Sent Mailbox
    await page.getByRole('button', { name: 'Sent' }).click();
    await page.waitForLoadState('networkidle');

    // 10. Wait for the list to load and click the latest message with our unique subject
    const messageRow = page.getByText(uniqueSubject).first();
    await expect(messageRow).toBeVisible({ timeout: 15000 });
    await messageRow.click();

    // 11. Verify the content contains the expected link
    const messageBody = page.locator('.prose');
    await expect(messageBody).toBeVisible({ timeout: 10000 });
    
    const html = await messageBody.innerHTML();
    console.log('RENDERED HTML:', html);
    
    const link = messageBody.locator('a');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', 'https://www.google.com');
    await expect(link).toHaveText('Google');

    console.log('Hyperlink verification passed!');
});
