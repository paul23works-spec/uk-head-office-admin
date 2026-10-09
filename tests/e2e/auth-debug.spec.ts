import { test, expect } from '@playwright/test';

test('Auth debug', async ({ page, context }) => {

  page.on('response', (response) => {
    if (response.status() >= 400) {
      console.log(`Network Error: ${response.status()} ${response.statusText()} on ${response.url()}`);
    }
  });

  // 1. Authenticate using login flow
  await page.goto('/login');
  await page.locator('button').filter({ hasText: 'MASTER' }).click();
  await page.waitForURL('**/');
  
  // 2. Read cookies
  const cookies = await context.cookies();
  console.log('Cookies after login:', cookies.map(c => `${c.name}=${c.value}`));

  // 3. Call /api/auth via GET in browser context
  const resAuth = await page.evaluate(async () => {
    const res = await fetch('/api/auth');
    return { status: res.status, body: await res.text() };
  });
  console.log('GET /api/auth:', resAuth);

  // 4. Call /api/projects via GET
  const resProjects = await page.evaluate(async () => {
    const res = await fetch('/api/projects');
    return { status: res.status, body: await res.text() };
  });
  console.log('GET /api/projects:', resProjects);
});
