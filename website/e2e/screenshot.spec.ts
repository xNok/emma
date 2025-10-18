import { test, expect } from '@playwright/test';

test('take screenshot', async ({ page }) => {
  await page.goto('file://./public/index.html');
  await page.screenshot({ path: 'screenshot.png' });
});