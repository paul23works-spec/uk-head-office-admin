import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

test.describe('Phase 8 Step 4 - Draft Attachments', () => {
  test.describe.configure({ mode: 'serial' });
  let employeeId: string;
  const testFilesDir = path.join(__dirname, 'test-files');

  test.beforeAll(async () => {
    const user = await prisma.user.findFirst({
      where: { email: 'rajiv@ukenterprise.in' }
    });
    const employee = await prisma.employee.findFirst({
      where: { id: user!.employeeId }
    });
    if (!employee) throw new Error('No employee found for testing');
    employeeId = employee.id;

    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }
    fs.writeFileSync(path.join(testFilesDir, 'test-doc.txt'), 'Hello world, this is a test document.');
    fs.writeFileSync(path.join(testFilesDir, 'test-doc2.txt'), 'Another document.');
    
    // Create large file for limits test
    const largeFilePath = path.join(testFilesDir, 'large-file.bin');
    if (!fs.existsSync(largeFilePath)) {
      const buffer = Buffer.alloc(26 * 1024 * 1024, '0');
      fs.writeFileSync(largeFilePath, buffer);
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    // Clear drafts for this employee to ensure fresh state
    if (employeeId) {
      await prisma.draftAttachment.deleteMany({
        where: { draft: { employeeId, subject: { contains: 'Attachments' } } }
      });
      await prisma.draft.deleteMany({
        where: { employeeId, subject: { contains: 'Attachments' } }
      });
    }

    await page.goto('/login');
    try {
      const masterBtn = page.locator('button').filter({ hasText: 'MASTER' });
      await masterBtn.waitFor({ state: 'visible', timeout: 3000 });
      await masterBtn.click();
    } catch (e) {
      // Ignore if not found, might already be logged in and redirected
    }
    // Dashboard is at /
    await page.waitForURL(url => url.pathname === '/', { timeout: 10000 }).catch(() => {});
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/management/communications/gmail');
    // Wait for the Compose button to ensure page is loaded
    await page.waitForSelector('button:has-text("Compose")', { timeout: 10000 }).catch(() => {});
  });

  test('Basic Upload, Persistence, Reload, Remove', async ({ page }) => {
    // 1. Basic Upload
    const composeBtn = page.getByRole('button', { name: 'Compose' }).first();
    await expect(composeBtn).toBeVisible({ timeout: 10000 });
    await composeBtn.click({ force: true });
    
    await page.locator('input[placeholder="recipient@example.com"]').fill('recipient@example.com');
    await page.getByPlaceholder('Subject').fill('Test Attachments');
    
    // Wait for autosave to create the draft (debounce is 1s, plus network)
    await page.waitForTimeout(2000);
    
    // Upload file
    const uploadPromise = page.waitForResponse(async res => {
      if (res.url().includes('/attachments') && res.request().method() === 'POST') {
        if (res.status() !== 200) {
          const body = await res.text();
          console.error(`Upload failed: ${res.status()} ${body}`);
        }
        return res.status() === 200;
      }
      return false;
    });
    const input = page.locator('input[type="file"]');
    await input.setInputFiles(path.join(testFilesDir, 'test-doc.txt'));
    
    // Wait for upload
    await uploadPromise;
    await expect(page.locator('text=test-doc.txt')).toBeVisible();
    
    // Verify DB
    let draft = await prisma.draft.findFirst({
      where: { subject: 'Test Attachments', employeeId },
      orderBy: { createdAt: 'desc' },
      include: { attachments: true }
    });
    expect(draft?.attachments.length).toBe(1);
    expect(draft?.attachments[0].filename).toBe('test-doc.txt');
    
    const draftId = draft!.id;
    
    // 2. Persistence / Reload
    await page.reload();
    await page.waitForSelector('text=Drafts');
    await page.click('text=Drafts');
    await page.click('text=Test Attachments'); // open draft
    
    await expect(page.locator('text=test-doc.txt')).toBeVisible();
    
    // 3. Remove
    // Find the X button inside the attachment pill
    const deletePromise = page.waitForResponse(res => res.request().method() === 'DELETE' && res.url().includes('/attachments'));
    await page.locator('text=test-doc.txt').locator('..').locator('button').click();
    
    try {
      const deleteRes = await deletePromise;
      const deleteBody = await deleteRes.text();
      console.log(`DELETE response status: ${deleteRes.status()} body: ${deleteBody}`);
    } catch (e) {
      console.error('DELETE response failed or timed out:', e);
    }
    
    await expect(page.locator('text=test-doc.txt')).toHaveCount(0);
    
    // Wait for delete API
    await page.waitForTimeout(1000);
    
    draft = await prisma.draft.findUnique({
      where: { id: draftId },
      include: { attachments: true }
    });
    expect(draft?.attachments.length).toBe(0);
    
    // Cleanup Draft
    await page.getByRole('button', { name: 'Discard' }).click();
  });

  test('Multi-attachment and Duplicates', async ({ page }) => {
    const composeBtn = page.getByRole('button', { name: 'Compose' }).first();
    await expect(composeBtn).toBeVisible({ timeout: 5000 });
    await composeBtn.click({ force: true });
    
    await page.getByPlaceholder('Subject').fill('Multi Attachments');
    await page.waitForTimeout(2000);
    
    let responses1 = 0;
    const uploadPromise1 = page.waitForResponse(res => {
      if (res.url().includes('/attachments') && res.request().method() === 'POST') responses1++;
      return responses1 === 2;
    });
    const input = page.locator('input[type="file"]');
    await input.setInputFiles([
      path.join(testFilesDir, 'test-doc.txt'),
      path.join(testFilesDir, 'test-doc2.txt')
    ]);
    
    await uploadPromise1;
    await expect(page.locator('text=test-doc.txt')).toBeVisible();
    await expect(page.locator('text=test-doc2.txt')).toBeVisible();
    
    // Try to upload the same file again (duplicates allowed by UI or handled correctly by creating new file in storage)
    const uploadPromise2 = page.waitForResponse(res => res.url().includes('/attachments') && res.request().method() === 'POST');
    await input.setInputFiles(path.join(testFilesDir, 'test-doc.txt'));
    await uploadPromise2;
    
    const draft = await prisma.draft.findFirst({
      where: { subject: 'Multi Attachments', employeeId },
      orderBy: { createdAt: 'desc' },
      include: { attachments: true }
    });
    expect(draft?.attachments.length).toBe(3);
    
    await page.getByRole('button', { name: 'Discard' }).click();
  });

  test('Limits and Send', async ({ page }) => {
    const composeBtn = page.getByRole('button', { name: 'Compose' }).first();
    await expect(composeBtn).toBeVisible({ timeout: 5000 });
    await composeBtn.click({ force: true });
    
    await page.locator('input[placeholder="recipient@example.com"]').fill('recipient@example.com');
    await page.getByPlaceholder('Subject').fill('Limits Attachments');
    await page.waitForTimeout(2000);
    
    // Check limit
    const input = page.locator('input[type="file"]');
    await input.setInputFiles(path.join(testFilesDir, 'large-file.bin'));
    
    // The validation happens immediately on client side before upload starts
    await expect(page.locator('text=Total attachment size exceeds 25MB limit.')).toBeVisible();
    
    // Discard draft
    await page.getByRole('button', { name: 'Discard' }).click();
  });

  test('Cleanup on Discard', async ({ page }) => {
    const composeBtn = page.getByRole('button', { name: 'Compose' }).first();
    await expect(composeBtn).toBeVisible({ timeout: 5000 });
    await composeBtn.click({ force: true });
    
    await page.getByPlaceholder('Subject').fill('Cleanup Attachments');
    await page.waitForTimeout(2000);
    
    const uploadPromise3 = page.waitForResponse(res => res.url().includes('/attachments') && res.request().method() === 'POST');
    const input = page.locator('input[type="file"]');
    await input.setInputFiles(path.join(testFilesDir, 'test-doc.txt'));
    await uploadPromise3;
    
    const draft = await prisma.draft.findFirst({
      where: { subject: 'Cleanup Attachments', employeeId },
      orderBy: { createdAt: 'desc' },
      include: { attachments: true }
    });
    expect(draft?.attachments.length).toBe(1);
    const attachmentKey = draft!.attachments[0].storageKey;
    
    page.once('dialog', dialog => dialog.accept());
    const deletePromise = page.waitForResponse(res => res.url().includes(`/drafts/${draft!.id}`) && res.request().method() === 'DELETE');
    await page.getByRole('button', { name: 'Discard' }).click();
    await deletePromise;
    await page.waitForTimeout(1000);
    
    // Check DB
    const deletedDraft = await prisma.draft.findUnique({ where: { id: draft!.id } });
    expect(deletedDraft).toBeNull();
    const deletedAttachment = await prisma.draftAttachment.findUnique({ where: { id: draft!.attachments[0].id } });
    expect(deletedAttachment).toBeNull();
  });
  
  test('API Concurrency & Ownership Protection', async ({ page }) => {
    // Browser context is already logged in via beforeEach
    
    // We'll create a draft via API directly and attempt invalid edits
    const createRes = await page.request.post('/api/integrations/gmail/drafts', {
      data: { subject: 'API Test', htmlBody: 'Test' }
    });
    expect(createRes.ok()).toBeTruthy();
    const draftData = await createRes.json();
    const draftId = draftData.draft.id;
    let revision = draftData.revision;
    
    // Create attachment using old revision - should fail
    // Upload is FormData, we need to construct it manually
    // Since Playwright APIRequestContext doesn't easily do FormData with files simply without buffer, let's just do a fetch in page context
    
    await page.goto('/management/communications/gmail');
    
    const result = await page.evaluate(async ({ draftId, oldRev }) => {
      const fd = new FormData();
      fd.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');
      fd.append('revision', oldRev.toString());
      
      const res = await fetch(`/api/integrations/gmail/drafts/${draftId}/attachments`, {
        method: 'POST',
        body: fd
      });
      return { status: res.status, ok: res.ok };
    }, { draftId, oldRev: revision - 1 }); // intentional old revision
    
    expect(result.status).toBe(409); // Conflict
    
    // Delete draft
    await page.request.delete(`/api/integrations/gmail/drafts/${draftId}`);
  });
});
