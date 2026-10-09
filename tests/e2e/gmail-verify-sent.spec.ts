import { test, expect } from '@playwright/test';

test('Verify Real Gmail Delivery - Sent Mailbox', async ({ page }) => {
    // 1. Go to Login and authenticate
    await page.goto('http://localhost:3000/login');
    await page.locator('button').filter({ hasText: 'MASTER' }).click();
    await page.waitForURL('**/');
    
    // 2. Go to Gmail
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:3000/management/communications/gmail');
    await page.waitForLoadState('networkidle');

    // 3. Go to Sent Mailbox
    await page.getByRole('button', { name: 'Sent' }).click();
    await page.waitForLoadState('networkidle');

    // 4. Wait for the list to load and click the latest message with our subject
    // We expect the subject to be "Automated Test: Link Verification"
    const messageRow = page.locator('div', { hasText: 'Automated Test: Link Verification' }).first();
    await expect(messageRow).toBeVisible({ timeout: 10000 });
    await messageRow.click();

    // 5. Verify the content contains the expected link
    const messageBody = page.locator('.prose'); // The message body is wrapped in this class
    await expect(messageBody).toBeVisible({ timeout: 10000 });
    
    const html = await messageBody.innerHTML();
    console.log('RENDERED HTML:', html);
    const link = messageBody.locator('a');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', 'https://www.google.com');
    await expect(link).toHaveText('Google');

    console.log('Hyperlink verification passed!');
});
