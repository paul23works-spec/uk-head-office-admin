import { test, expect } from '@playwright/test';

test.describe('UK Enterprise Gmail - Hyperlinks Phase 6', () => {
  test('Insert and validate hyperlinks in Compose editor', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.locator('button').filter({ hasText: 'MASTER' }).click();
    await page.waitForURL('**/');

    // 2. Go to Gmail
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/management/communications/gmail');
    await page.waitForLoadState('networkidle');

    // 3. Open Compose
    await page.getByRole('button', { name: 'Compose' }).click({ force: true });
    // 4. Type text in the editor
    const editor = page.locator('div[contenteditable="true"]');
    await editor.click();
    await editor.type('Check out this search engine');

    // Select the text "search engine" (last 13 characters)
    await page.evaluate(() => {
      const el = document.querySelector('div[contenteditable="true"]');
      if (!el || !el.firstChild) return;
      const range = document.createRange();
      const sel = window.getSelection();
      range.setStart(el.firstChild, 14);
      range.setEnd(el.firstChild, 27);
      sel?.removeAllRanges();
      sel?.addRange(range);
    });

    // We will stub window.prompt and window.alert to control the flow and intercept dialogs
    let promptResult: string | null = null;
    let alertMessage: string | null = null;

    page.on('dialog', async dialog => {
      const type = dialog.type();
      const message = dialog.message();
      if (type === 'prompt') {
        if (promptResult === null) {
          await dialog.dismiss();
        } else {
          await dialog.accept(promptResult);
        }
      } else if (type === 'alert') {
        alertMessage = message;
        await dialog.accept();
      }
    });

    // 5. Cancel test (promptResult is null)
    await page.locator('button[title="Insert Link"]').click();
    
    // Verify it was cancelled and no link exists
    let html = await editor.innerHTML();
    expect(html).not.toContain('<a href');

    // 6. Security test (Javascript)
    promptResult = 'javascript:alert(1)';
    alertMessage = null;
    await page.locator('button[title="Insert Link"]').click();
    expect(alertMessage).toContain('Unsafe');
    html = await editor.innerHTML();
    expect(html).not.toContain('<a href');

    // 7. Security test (Data URI)
    promptResult = 'data:text/html,<script>alert(1)</script>';
    alertMessage = null;
    await page.locator('button[title="Insert Link"]').click();
    expect(alertMessage).toContain('Unsafe');
    html = await editor.innerHTML();
    expect(html).not.toContain('<a href');

    // 8. Success test (Normal HTTPS)
    promptResult = 'https://www.google.com';
    await page.locator('button[title="Insert Link"]').click();
    html = await editor.innerHTML();
    expect(html).toContain('<a href="https://www.google.com"');

    // 9. Auto-prefix HTTP
    // Clear and type new text
    await editor.fill('');
    await editor.type('Example');
    await page.evaluate(() => {
      const el = document.querySelector('div[contenteditable="true"]');
      if (!el || !el.firstChild) return;
      const range = document.createRange();
      const sel = window.getSelection();
      range.setStart(el.firstChild, 0);
      range.setEnd(el.firstChild, 7);
      sel?.removeAllRanges();
      sel?.addRange(range);
    });

    promptResult = 'example.com';
    await page.locator('button[title="Insert Link"]').click();
    html = await editor.innerHTML();
    expect(html).toContain('<a href="https://example.com"');

    console.log('Hyperlink validation tests passed!');
  });
});
