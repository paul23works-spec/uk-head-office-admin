import { test, expect } from '@playwright/test';

test.describe('Phase 7: Gmail Reply, Reply All, and Forward', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate
    await page.goto('http://localhost:3000/login');
    await page.locator('button').filter({ hasText: 'MASTER' }).click();
    await page.waitForURL('**/');

    // Navigate to the Gmail workspace
    await page.goto('http://localhost:3000/management/communications/gmail');
    
    // Wait for inbox to load and click the first message
    await page.waitForSelector('.flex.items-center.gap-4.p-4', { state: 'visible' });
    const firstMessage = page.locator('.flex.items-center.gap-4.p-4').first();
    await firstMessage.click();
    
    // Wait for message details to load
    await page.waitForSelector('.prose', { state: 'visible' });
  });

  test('should open compose window with Reply prepopulated', async ({ page }) => {
    // Click Reply button
    await page.locator('button[title="Reply"]').click();

    // Compose window should be visible
    await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible();

    // Wait for the To field to be filled
    const toInput = page.locator('input[placeholder="recipient@example.com"]');
    await expect(toInput).not.toBeEmpty();

    // Subject should be filled and contain Re:
    const subjectInput = page.locator('input[type="text"]').nth(3);
    await expect(subjectInput).not.toBeEmpty();
    const subjectValue = await subjectInput.inputValue();
    expect(subjectValue.toLowerCase()).toContain('re:');

    // Body should contain the quoted text
    const editor = page.locator('[contenteditable="true"]');
    await expect(editor).toContainText('wrote:');
  });

  test('should open compose window with Reply All prepopulated', async ({ page }) => {
    // Click Reply All button
    await page.locator('button[title="Reply All"]').click();

    await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible();

    const toInput = page.locator('input[placeholder="recipient@example.com"]');
    await expect(toInput).not.toBeEmpty();

    const subjectInput = page.locator('input[type="text"]').nth(3);
    await expect(subjectInput).not.toBeEmpty();
    const subjectValue = await subjectInput.inputValue();
    expect(subjectValue.toLowerCase()).toContain('re:');
  });

  test('should open compose window with Forward prepopulated', async ({ page }) => {
    // Click Forward button
    await page.locator('button[title="Forward"]').click();

    await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible();

    // To field should be empty for forward
    const toInput = page.locator('input[placeholder="recipient@example.com"]');
    await expect(toInput).toBeEmpty();

    const subjectInput = page.locator('input[type="text"]').nth(3);
    await expect(subjectInput).not.toBeEmpty();
    const subjectValue = await subjectInput.inputValue();
    expect(subjectValue.toLowerCase()).toContain('fwd:');

    const editor = page.locator('[contenteditable="true"]');
    await expect(editor).toContainText('wrote:');
  });
});
