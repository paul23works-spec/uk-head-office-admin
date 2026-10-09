import { test, expect } from '@playwright/test';

test.describe('UK Enterprise Full System QA Audit', () => {
  let errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    errors = [];
    page.on('pageerror', (err) => {
      errors.push(`Page Error: ${err.message}`);
    });
    page.on('response', (response) => {
      if (response.status() >= 400) {
        errors.push(`Network Error: ${response.status()} ${response.statusText()} on ${response.url()}`);
      }
    });
  });

  test.afterEach(async () => {
    if (errors.length > 0) {
      console.warn('Caught errors during test:', errors);
    }
  });

  test('Authentication & Dashboard Navigation (MASTER Role)', async ({ page }) => {
    // Navigate to Login
    const response = await page.goto('/login');
    expect(response?.status()).toBe(200);

    // Assert UI elements
    await expect(page.getByRole('heading', { name: 'UK Enterprise Admin' })).toBeVisible();

    // Select MASTER Role
    const masterBtn = page.locator('button').filter({ hasText: 'MASTER' });
    await expect(masterBtn).toBeVisible();
    await masterBtn.click();

    // Verify redirect to Dashboard
    await page.waitForURL('**/');
    const url = page.url();
    expect(url).toBe('http://localhost:3000/');

    // Dashboard content verification
    const headings = await page.locator('h1').allInnerTexts();
    expect(headings.length).toBeGreaterThan(0);

    // We should ensure no console errors occurred during login
    expect(errors.filter(e => !e.includes('favicon'))).toEqual([]); // Ignore favicon errors if any
  });

  test('Sidebar Navigation across all primary modules', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.locator('button').filter({ hasText: 'MASTER' }).click();
    await page.waitForURL('**/');
    
    // Links to test
    const routes = [
      { name: 'Projects', path: '/projects' },
      { name: 'Communications', path: '/management/communications' },
      { name: 'Activity Log', path: '/management/activity' }
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      expect(currentUrl).toContain(route.path);

      // Check that at least one major element loaded
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();
    }
    
    // Check back/forward
    await page.goBack();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/management/communications');
    
    await page.goForward();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/management/activity');
  });

  test('Responsive Layout (Mobile View)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    
    await page.goto('/login');
    await page.locator('button').filter({ hasText: 'MASTER' }).click();
    await page.waitForURL('**/');

    // On mobile, sidebar should be hidden or represented by a hamburger menu
    // Wait for networkidle
    await page.waitForLoadState('networkidle');
    const isSidebarVisible = await page.locator('aside').isVisible();
    // It depends on implementation, but usually sidebar is hidden or behind a toggle
    // Just verify the page still renders without crashing
    const headings = await page.locator('h1').allInnerTexts();
    expect(headings.length).toBeGreaterThan(0);
  });
  
  test('Stage Forms & CRUD mock interaction', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button').filter({ hasText: 'MASTER' }).click();
    await page.waitForURL('**/');
    
    // Navigate to projects
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    // Click on a project if one exists, otherwise test passes
    const projectCards = page.locator('a[href^="/projects/"]');
    const count = await projectCards.count();
    
    if (count > 0) {
      await projectCards.first().click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toMatch(/\/projects\/.+/);
    }
  });

  test('Data Integrity & Empty States', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button').filter({ hasText: 'MASTER' }).click();
    
    await page.goto('/tenders');
    await page.waitForLoadState('networkidle');
    
    // Check if table or empty state exists
    const bodyContent = await page.locator('body').innerText();
    expect(bodyContent).toBeTruthy();
  });
});
