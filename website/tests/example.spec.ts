import { test, expect, Page } from '@playwright/test';

test('has title', async ({ page }: { page: Page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/My New Hugo Site/);
});

test('has header', async ({ page }: { page: Page }) => {
  await page.goto('/');
  await expect(page.locator('header h1 a')).toHaveText('My New Hugo Site');
});

test('has footer', async ({ page }: { page: Page }) => {
  await page.goto('/');
  await expect(page.locator('footer p')).toContainText('🧑‍💻Built by Emma🚀');
});
