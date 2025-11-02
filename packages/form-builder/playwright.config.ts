import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for Emma CLI End-to-End tests
 * Tests the complete Emma workflow from CLI commands to browser experience
 */
export default defineConfig({
  testDir: './src/__tests__/e2e',

  /* Run tests in sequence since they interact with CLI and server */
  fullyParallel: false,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Single worker to avoid port conflicts */
  workers: 1,

  /* Reporter to use */
  reporter: [['html'], ['list']],

  /* Timeout for each test */
  timeout: 60000,

  /* Shared settings */
  use: {
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        channel: 'chromium',
        headless: !process.env.HEADED,
      },
    },
  ],
});
