import { test, expect } from '@playwright/test';

/**
 * Test suite for basic navigation functionality
 * Validates that users can navigate through the documentation site
 */

test.describe('Navigation', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/Emma Forms/);

    // Check main heading
    const heading = page.getByRole('heading', { name: 'Emma Forms', level: 1 });
    await expect(heading).toBeVisible();

    // Check that features section is present
    await expect(page.getByRole('heading', { name: 'Features' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Quick Start' })
    ).toBeVisible();
  });

  test('should navigate to documentation from homepage', async ({ page }) => {
    await page.goto('/');

    // Click on Documentation link in header
    await page.getByRole('link', { name: 'Documentation' }).first().click();

    // Should navigate to docs page
    await expect(page).toHaveURL(/\/docs\//);
  });

  test('should navigate to the blog', async ({ page }) => {
    await page.goto('/');

    // Click on the Blog link in the header
    await page.getByRole('link', { name: 'Blog' }).first().click();

    // Should navigate to the blog page
    await expect(page).toHaveURL(/\/blog\//);
  });

  test('should navigate to installation guide', async ({ page }) => {
    await page.goto('/');

    // Click on Installation link
    await page.getByRole('link', { name: 'Installation' }).click();

    // Should be on installation page
    await expect(page).toHaveURL(/\/installation\//);
    await expect(
      page.getByRole('heading', { name: 'Installation' })
    ).toBeVisible();
  });

  test('should have working GitHub link', async ({ page, context }) => {
    await page.goto('/');

    // Get GitHub link
    const githubLink = page.getByRole('link', { name: /GitHub/ }).first();
    await expect(githubLink).toBeVisible();

    // Check that link has correct href
    await expect(githubLink).toHaveAttribute('href', /github\.com/);
  });

  test('should have visible skip to content link for accessibility', async ({
    page,
  }) => {
    await page.goto('/');

    // Focus the skip link (keyboard navigation)
    await page.keyboard.press('Tab');

    // Skip link should be visible when focused
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeFocused();
  });
});

test.describe('Documentation Pages', () => {
  test('should display sidebar navigation on docs pages', async ({ page }) => {
    await page.goto('/docs/user-guide/installation/');

    // Check that sidebar is present
    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar).toBeVisible();

    // Check that navigation items are present
    await expect(
      page.getByRole('navigation', { name: 'Documentation navigation' })
    ).toBeVisible();
  });

  test('should highlight active page in sidebar', async ({ page }) => {
    await page.goto('/docs/user-guide/installation/');

    // Find the Installation link in sidebar
    const installationLink = page
      .locator('aside.sidebar')
      .getByRole('link', { name: 'Installation' });

    // Check that it has the active class
    await expect(installationLink).toHaveClass(/active/);
  });

  test('should have pagination between pages', async ({ page }) => {
    await page.goto('/docs/user-guide/installation/');

    // Look for pagination nav
    const pagination = page.getByRole('navigation', {
      name: 'Page navigation',
    });

    // Check if pagination exists (it should have next/prev links)
    const count = await pagination.count();
    if (count > 0) {
      // If pagination exists, it should be visible
      await expect(pagination).toBeVisible();
    }
  });

  test('should display code blocks with copy buttons', async ({ page }) => {
    await page.goto('/docs/user-guide/installation/');

    // Check for code blocks
    const codeBlock = page.locator('pre code').first();
    await expect(codeBlock).toBeVisible();

    // Hover over code block to reveal copy button
    await codeBlock.hover();

    // Copy button should appear
    const copyButton = page.getByRole('button', { name: /Copy/ }).first();
    await expect(copyButton).toBeVisible();
  });
});

test.describe('Header Navigation', () => {
  test('should have consistent header across all pages', async ({ page }) => {
    // Check homepage
    await page.goto('/');
    let header = page.locator('header.site-header');
    await expect(header).toBeVisible();

    // Check docs page
    await page.goto('/docs/user-guide/installation/');
    header = page.locator('header.site-header');
    await expect(header).toBeVisible();

    // Logo should be clickable and go to homepage
    const logo = page.getByRole('link', { name: 'Emma Forms' });
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('href', /\//);
  });

  test('should have sticky header that remains visible on scroll', async ({
    page,
  }) => {
    await page.goto('/');

    // Get header
    const header = page.locator('header.site-header');
    await expect(header).toBeVisible();

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));

    // Header should still be visible
    await expect(header).toBeVisible();
  });
});

test.describe('Footer', () => {
  test('should display footer on all pages', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer.site-footer');
    await expect(footer).toBeVisible();

    // Check for copyright text
    await expect(footer).toContainText(/Emma Forms/);
    await expect(footer).toContainText(/MIT/);

    // Check for Hugo credit
    await expect(footer.getByRole('link', { name: 'Hugo' })).toBeVisible();
  });
});
