import { test, expect } from '@playwright/test';

test('Verify Real Gmail Delivery', async ({ page }) => {
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
    await page.locator('input[placeholder="recipient@example.com"]').fill('test@example.com');
    await page.locator('input[type="text"]').nth(3).fill('Automated Test: Link Verification');

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

    // 7. Click Link
    page.on('dialog', dialog => dialog.accept('https://www.google.com'));
    await page.locator('button[title="Insert Link"]').click();

    // 8. Send
    // Intercept API response
    const sendPromise = page.waitForResponse(res => res.url().includes('/api/integrations/gmail/send') && res.request().method() === 'POST');
    await page.getByRole('button', { name: 'Send', exact: true }).click();

    const response = await sendPromise;
    const status = response.status();
    let body = {};
    try {
        body = await response.json();
    } catch(e) {}

    console.log('SEND RESPONSE STATUS:', status);
    console.log('SEND RESPONSE BODY:', body);

    if (status !== 200) {
        throw new Error('Send failed with status ' + status);
    }
});
