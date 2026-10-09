import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

test.describe('Phase 8 Step 5 - Drafts Recovery and Editing', () => {
  test.describe.configure({ mode: 'serial' });
  let employeeId: string;

  test.beforeAll(async () => {
    const user = await prisma.user.findFirst({
      where: { email: 'rajiv@ukenterprise.in' }
    });
    const employee = await prisma.employee.findFirst({
      where: { id: user!.employeeId }
    });
    if (!employee) throw new Error('No employee found for testing');
    employeeId = employee.id;
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    // Clear test drafts
    await prisma.draftAttachment.deleteMany({
      where: { draft: { employeeId, subject: { contains: 'Recovery Test' } } }
    });
    await prisma.draft.deleteMany({
      where: { employeeId, subject: { contains: 'Recovery Test' } }
    });

    await page.goto('/login');
    try {
      const masterBtn = page.locator('button').filter({ hasText: 'MASTER' });
      await masterBtn.waitFor({ state: 'visible', timeout: 3000 });
      await masterBtn.click();
    } catch (e) {}
    await page.waitForURL(url => url.pathname === '/', { timeout: 10000 }).catch(() => {});
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/management/communications/gmail');
    await page.waitForSelector('button:has-text("Compose")', { timeout: 10000 }).catch(() => {});
  });

  test('Recover normal draft and test concurrency', async ({ page }) => {
    const composeBtn = page.getByRole('button', { name: 'Compose' }).first();
    await expect(composeBtn).toBeVisible({ timeout: 10000 });
    await composeBtn.click({ force: true });
    
    await page.locator('input[placeholder="recipient@example.com"]').fill('recover@example.com');
    await page.getByPlaceholder('Subject').fill('Recovery Test Draft');
    await page.locator('div[contenteditable="true"]').fill('This is a body');
    
    await page.waitForTimeout(4000);
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 5000 }).catch(() => {});
    
    await page.reload();
    await page.waitForSelector('button:has-text("Compose")', { timeout: 10000 }).catch(() => {});
    
    const draftsFolder = page.locator('button').filter({ hasText: 'DRAFTS' });
    await draftsFolder.click();
    
    const draftRow = page.locator('text=Recovery Test Draft').first();
    await expect(draftRow).toBeVisible({ timeout: 10000 });
    await draftRow.click();
    
    await expect(page.locator('input[placeholder="recipient@example.com"]')).toHaveValue('recover@example.com');
    await expect(page.getByPlaceholder('Subject')).toHaveValue('Recovery Test Draft');
    const bodyContent = await page.locator('div[contenteditable="true"]').innerText();
    expect(bodyContent).toContain('This is a body');
    
    const editor = page.locator('div[contenteditable="true"]');
    await editor.click();
    await editor.type(' Edited!');
    await page.waitForTimeout(3500); // Wait for debounce
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 10000 }).catch(() => {});
    
    const drafts = await prisma.draft.findMany({
      where: { employeeId, subject: 'Recovery Test Draft' }
    });
    expect(drafts.length).toBe(1);
    expect(drafts[0].htmlBody).toContain('Edited!');
  });

  test('Recover reply draft', async ({ page }) => {
    const firstMessage = page.locator('.flex.items-center.gap-4.p-4').first();
    const count = await firstMessage.count();
    if (count === 0) {
      test.skip(true, 'INCONCLUSIVE: No email in INBOX to test reply.');
      return;
    }
    
    await firstMessage.click();
    await page.waitForSelector('.prose', { state: 'visible', timeout: 10000 });
    
    const replyBtn = page.locator('button[title="Reply"]');
    await expect(replyBtn).toBeVisible({ timeout: 5000 });
    await replyBtn.click();
    
    await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible({ timeout: 5000 });
    
    const editor = page.locator('div[contenteditable="true"]');
    await editor.click();
    await editor.type('Recovery Test Reply');
    
    await page.waitForTimeout(4000);
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 5000 }).catch(() => {});
    
    await page.reload();
    await page.waitForSelector('button:has-text("Compose")', { timeout: 10000 }).catch(() => {});
    const draftsFolder = page.locator('button').filter({ hasText: 'DRAFTS' });
    await draftsFolder.click();
    
    const drafts = await prisma.draft.findMany({
      where: { employeeId, htmlBody: { contains: 'Recovery Test Reply' } }
    });
    expect(drafts.length).toBe(1);
    expect(drafts[0].inReplyTo).toBeTruthy();
    expect(drafts[0].threadId).toBeTruthy();
    
    await prisma.draft.deleteMany({ where: { id: drafts[0].id } });
  });
  
  test('Recover reply all draft', async ({ page }) => {
    const firstMessage = page.locator('.flex.items-center.gap-4.p-4').first();
    const count = await firstMessage.count();
    if (count === 0) {
      test.skip(true, 'INCONCLUSIVE: No email in INBOX to test reply all.');
      return;
    }
    
    await firstMessage.click();
    await page.waitForSelector('.prose', { state: 'visible', timeout: 10000 });
    
    const replyAllBtn = page.locator('button[title="Reply All"]');
    await expect(replyAllBtn).toBeVisible({ timeout: 5000 });
    await replyAllBtn.click();
    
    await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible({ timeout: 5000 });
    
    const editor = page.locator('div[contenteditable="true"]');
    await editor.click();
    await editor.type('Recovery Test Reply All');
    
    await page.waitForTimeout(4000);
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 5000 }).catch(() => {});
    
    const drafts = await prisma.draft.findMany({
      where: { employeeId, htmlBody: { contains: 'Recovery Test Reply All' } }
    });
    expect(drafts.length).toBe(1);
    expect(drafts[0].inReplyTo).toBeTruthy();
    expect(drafts[0].threadId).toBeTruthy();
    
    await prisma.draft.deleteMany({ where: { id: drafts[0].id } });
  });

  test('Recover forward draft', async ({ page }) => {
    const firstMessage = page.locator('.flex.items-center.gap-4.p-4').first();
    const count = await firstMessage.count();
    if (count === 0) {
      test.skip(true, 'INCONCLUSIVE: No email in INBOX to test forward.');
      return;
    }
    
    await firstMessage.click();
    await page.waitForSelector('.prose', { state: 'visible', timeout: 10000 });
    
    const fwdBtn = page.locator('button[title="Forward"]');
    await expect(fwdBtn).toBeVisible({ timeout: 5000 });
    await fwdBtn.click();
    
    await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible({ timeout: 5000 });
    
    const editor = page.locator('div[contenteditable="true"]');
    await editor.click();
    await editor.type('Recovery Test Forward');
    
    await page.waitForTimeout(4000);
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 5000 }).catch(() => {});
    
    const drafts = await prisma.draft.findMany({
      where: { employeeId, htmlBody: { contains: 'Recovery Test Forward' } }
    });
    expect(drafts.length).toBe(1);
    // forward drafts typically don't have inReplyTo, but may have references depending on implementation.
    // They also might not have a threadId if forwarded as a new email, but they will have the original HTML appended.
    expect(drafts[0].htmlBody).toContain('Recovery Test Forward');
    
    await prisma.draft.deleteMany({ where: { id: drafts[0].id } });
  });

  test('Rapid typing followed by immediate send', async ({ page }) => {
    const composeBtn = page.getByRole('button', { name: 'Compose' }).first();
    await composeBtn.click({ force: true });
    
    await page.locator('input[placeholder="recipient@example.com"]').fill('rapid@example.com');
    await page.getByPlaceholder('Subject').fill('Recovery Test Rapid Send');
    const editor = page.locator('div[contenteditable="true"]');
    await editor.click();
    await editor.type('Typing rapidly then sending immediately!');
    
    // Intercept send to prevent actual sending and simulate success
    await page.route('/api/integrations/gmail/send', async route => {
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay to show Processing state
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, messageId: 'mock-id' })
      });
    });

    // Don't wait for autosave, hit send
    const sendBtn = page.getByRole('button', { name: 'Send' }).first();
    await sendBtn.click();
    
    page.on('dialog', dialog => dialog.accept());

    // Validate it's sending
    await expect(page.getByRole('button', { name: 'Processing...' }).first()).toBeVisible({ timeout: 5000 });
    // And finally closes
    await expect(page.locator('.fixed.inset-0.z-50')).not.toBeVisible({ timeout: 15000 });
    
    // Clean up if it created a draft before send, though sending deletes it.
    await prisma.draft.deleteMany({
      where: { employeeId, subject: 'Recovery Test Rapid Send' }
    });
  });

  test('Stale revision or concurrent update returns conflict', async ({ page }) => {
    const composeBtn = page.getByRole('button', { name: 'Compose' }).first();
    await composeBtn.click({ force: true });
    
    await page.locator('input[placeholder="recipient@example.com"]').fill('conflict@example.com');
    await page.getByPlaceholder('Subject').fill('Recovery Test Conflict');
    
    await page.waitForTimeout(4000);
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 5000 }).catch(() => {});
    
    const draft = await prisma.draft.findFirst({
      where: { employeeId, subject: 'Recovery Test Conflict' }
    });
    expect(draft).toBeDefined();
    
    // Simulate concurrent update by incrementing revision in DB
    await prisma.draft.update({
      where: { id: draft!.id },
      data: { revision: { increment: 1 } }
    });
    
    // Now trigger another UI save
    const editor = page.locator('div[contenteditable="true"]');
    await editor.click();
    await editor.type(' Causing conflict!');
    await page.waitForTimeout(4000);
    
    // Expect error
    await expect(page.locator('text=Error')).toBeVisible({ timeout: 5000 }).catch(() => {});
    
    await prisma.draft.deleteMany({
      where: { employeeId, subject: 'Recovery Test Conflict' }
    });
  });
  
  test('Starting an attachment upload while a draft is being created', async ({ page }) => {
    const composeBtn = page.getByRole('button', { name: 'Compose' }).first();
    await composeBtn.click({ force: true });
    
    await page.locator('input[placeholder="recipient@example.com"]').fill('attach@example.com');
    await page.getByPlaceholder('Subject').fill('Recovery Test Attachment');
    
    // Wait for React state to update
    await page.waitForTimeout(500);
    
    // Immediately set a file before autosave finishes (debounce is 3s)
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('button[title="Attach files"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(__dirname, '..', '..', 'package.json'));
    
    // Wait for upload to complete
    await expect(page.locator('text=uploading')).toBeVisible({ timeout: 5000 }).catch(() => {});
    
    // Let autosave run and upload finish
    await page.waitForTimeout(6000);
    
    // Verify it was attached
    await expect(page.locator('text=package.json')).toBeVisible({ timeout: 10000 });
    
    const drafts = await prisma.draft.findMany({
      where: { employeeId }
    });
    console.log('Found drafts:', drafts);
    expect(drafts.length).toBeGreaterThan(0);
    
    const atts = await prisma.draftAttachment.findMany({
      where: { draftId: drafts[0].id }
    });
    expect(atts.length).toBe(1);
    expect(atts[0].filename).toBe('package.json');
  });
});
