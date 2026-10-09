import { test, expect } from '@playwright/test';

test('Smoke test: application loads and interacts', async ({ page }) => {
  // 1. Launch real Chromium and open localhost:3000
  await page.goto('/');

  // 2. Wait for the real application to load
  await page.waitForLoadState('networkidle');

  // 3. Read the page URL
  const url = page.url();
  console.log('Current URL:', url);
  expect(url).toContain('/login');

  // 4. Read the page title
  const title = await page.title();
  console.log('Page title:', title);

  // 5. Locate a real visible UI element and interact with it
  const loginButton = page.getByRole('button', { name: /Select Simulated Role/i });
  if (await loginButton.isVisible()) {
    // We are just interacting with something on the page (though these are the individual buttons inside)
    // Wait, the buttons are list items. Let's find a user button.
    const employeeButton = page.locator('button').filter({ hasText: 'Admin User' });
    await expect(employeeButton).toBeVisible();
    await employeeButton.click();
  } else {
    // Alternatively click the first button
    const firstButton = page.locator('button').first();
    await expect(firstButton).toBeVisible();
    await firstButton.click();
  }

  // 6. Verify a real resulting state (Navigation to dashboard)
  await expect(page).not.toHaveURL(/.*\/login/);

  // 7. Capture a screenshot
  await page.screenshot({ path: 'tests/e2e/screenshots/smoke.png' });
});
