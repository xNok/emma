import { test, expect } from '@playwright/test';

test('take screenshot', async ({ page }) => {
  const baseUrl = process.env.BASE_URL || 'file://./public';
  await page.goto(`${baseUrl}/index.html`);
  await page.screenshot({ path: 'screenshot.png' });
});