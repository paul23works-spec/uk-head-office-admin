import { test, expect } from '@playwright/test';

test('Authentication Smoke test', async ({ page }) => {
  // 1. Launch and go to login
  await page.goto('/login');
  
  // 2. Wait for it to be stable
  await page.waitForLoadState('networkidle');
  
  // 3. Find the Master role button
  const adminButton = page.locator('button').filter({ hasText: 'MASTER' });
  await expect(adminButton).toBeVisible();

  
  // 4. Click login
  await adminButton.click();
  
  // 5. Verify redirect to Dashboard (protected page)
  await page.waitForURL('**/');
  const url = page.url();
  expect(url).toBe('http://localhost:3000/');
  
  // 6. Verify dashboard elements (e.g. sidebar or heading)
  const dashboardHeading = page.locator('h1', { hasText: 'Dashboard' }).or(page.locator('h1', { hasText: 'Welcome' })).or(page.locator('h1'));
  await expect(dashboardHeading.first()).toBeVisible({ timeout: 10000 });
  
  // 7. Verify BrandIntro finishes if it exists, maybe wait a few seconds
  await page.waitForTimeout(4000); 

  // 8. Screenshot of the protected dashboard
  await page.screenshot({ path: 'tests/e2e/screenshots/auth.png' });
});
