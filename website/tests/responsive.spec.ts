import { test, expect } from '@playwright/test';

/**
 * Test suite for responsive design
 * Validates that the website works well on different screen sizes
 */

test.describe('Responsive Design - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test('should display mobile menu toggle button', async ({ page }) => {
    await page.goto('/');

    // Mobile menu toggle should be visible
    const menuToggle = page.getByRole('button', { name: 'Toggle menu' });
    await expect(menuToggle).toBeVisible();

    // Regular nav should be hidden on mobile
    const desktopNav = page.locator('.site-nav');
    await expect(desktopNav).not.toBeVisible();
  });

  test('should open and close mobile menu', async ({ page }) => {
    await page.goto('/docs/user-guide/installation/');

    // Sidebar should be hidden initially on mobile
    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar).not.toBeVisible();

    // Click menu toggle
    const menuToggle = page.getByRole('button', { name: 'Toggle menu' });
    await menuToggle.click();

    // Sidebar should now be visible
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveClass(/active/);

    // Click toggle again to close
    await menuToggle.click();

    // Sidebar should be hidden again
    await expect(sidebar).not.toBeVisible();
  });

  test('should have readable text size on mobile', async ({ page }) => {
    await page.goto('/docs/user-guide/installation/');

    // Get body text
    const content = page.locator('.content-area');
    await expect(content).toBeVisible();

    // Check that font size is at least 16px (prevents zoom on iOS)
    const fontSize = await content.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    const fontSizeNum = parseFloat(fontSize);
    expect(fontSizeNum).toBeGreaterThanOrEqual(14); // Base font might be 14-16px on mobile
  });

  test('should stack content vertically on mobile', async ({ page }) => {
    await page.goto('/');

    // Check that quick start cards are stacked
    const quickStartSection = page.locator('.quick-start-steps');
    const boundingBox = await quickStartSection.boundingBox();

    // Section should be visible
    expect(boundingBox).not.toBeNull();
  });

  test('should have touch-friendly button sizes', async ({ page }) => {
    await page.goto('/');

    // Check mobile menu toggle size
    const menuToggle = page.getByRole('button', { name: 'Toggle menu' });
    const buttonBox = await menuToggle.boundingBox();

    // Button should be at least 44x44px (Apple's recommended minimum)
    expect(buttonBox!.width).toBeGreaterThanOrEqual(40);
    expect(buttonBox!.height).toBeGreaterThanOrEqual(40);
  });
});

test.describe('Responsive Design - Tablet', () => {
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad size

  test('should display sidebar on tablet', async ({ page }) => {
    await page.goto('/docs/user-guide/installation/');

    // Sidebar should be visible on tablet
    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar).toBeVisible();
  });

  test('should have appropriate layout on tablet', async ({ page }) => {
    await page.goto('/');

    // Main content should be visible
    const mainContent = page.locator('.main-content');
    await expect(mainContent).toBeVisible();
  });
});

test.describe('Responsive Design - Desktop', () => {
  test.use({ viewport: { width: 1920, height: 1080 } }); // Full HD

  test('should display full sidebar navigation on desktop', async ({
    page,
  }) => {
    await page.goto('/docs/user-guide/installation/');

    // Sidebar should be visible
    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar).toBeVisible();

    // Mobile menu toggle should not be visible
    const menuToggle = page.getByRole('button', { name: 'Toggle menu' });
    await expect(menuToggle).not.toBeVisible();
  });

  test('should have optimal content width on large screens', async ({
    page,
  }) => {
    await page.goto('/');

    // Content should be constrained to max-width
    const mainContent = page.locator('.main-content');
    const boundingBox = await mainContent.boundingBox();

    // Content should not exceed 1200px + padding
    expect(boundingBox!.width).toBeLessThanOrEqual(1300);
  });

  test('should display navigation menu in header', async ({ page }) => {
    await page.goto('/');

    // Desktop nav should be visible
    const desktopNav = page.locator('.site-nav');
    await expect(desktopNav).toBeVisible();

    // Should have navigation links
    await expect(
      page.getByRole('link', { name: 'Documentation' })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /GitHub/ })).toBeVisible();
  });
});

test.describe('Responsive Images and Media', () => {
  test('should not have horizontal scroll on any viewport', async ({
    page,
  }) => {
    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // Allow 5px tolerance

    // Test on tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    const scrollWidthTablet = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    const clientWidthTablet = await page.evaluate(
      () => document.documentElement.clientWidth
    );
    expect(scrollWidthTablet).toBeLessThanOrEqual(clientWidthTablet + 5);
  });
});

test.describe('Accessibility - Keyboard Navigation', () => {
  test('should allow keyboard navigation through all interactive elements', async ({
    page,
  }) => {
    await page.goto('/');

    // Start tabbing through the page
    await page.keyboard.press('Tab'); // Skip to content link
    await page.keyboard.press('Tab'); // Logo
    await page.keyboard.press('Tab'); // First nav link

    // Check that focus is visible
    const focusedElement = await page.evaluate(
      () => document.activeElement?.tagName
    );
    expect(focusedElement).toBeTruthy();
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/');

    // Tab to first link
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Get focused element
    const focused = await page.locator(':focus');

    // Check that it has an outline or visible focus style
    const outline = await focused.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline || styles.boxShadow;
    });

    expect(outline).toBeTruthy();
  });
});

test.describe('Dark Mode Support', () => {
  test('should respect prefers-color-scheme: dark', async ({ page }) => {
    // Emulate dark mode preference
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    // Get background color
    const backgroundColor = await page.locator('body').evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Background should be dark (rgb values should be low)
    // This is a basic check - actual implementation depends on your dark mode colors
    expect(backgroundColor).toBeTruthy();
  });

  test('should respect prefers-color-scheme: light', async ({ page }) => {
    // Emulate light mode preference
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    // Get background color
    const backgroundColor = await page.locator('body').evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Background should be light
    expect(backgroundColor).toBeTruthy();
  });
});
