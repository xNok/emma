import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Miniflare } from 'miniflare';
import { execSync, spawn, ChildProcess } from 'child_process';
import { chromium, Browser, Page } from 'playwright';
import path from 'path';
import fs from 'fs-extra';

const E2E_PREFIX = 'e2e-';
const FORM_NAME = `${E2E_PREFIX}contact-form`;
const FORM_ID = `${FORM_NAME}-001`;
const TEST_DIR = path.resolve(__dirname, 'e2e-test-dir');

describe('End-to-End Test', () => {
  let mf: Miniflare;
  let browser: Browser;
  let page: Page;
  let hugoProcess: ChildProcess;

  beforeAll(async () => {
    // Create a temporary directory for the test
    fs.ensureDirSync(TEST_DIR);

    mf = new Miniflare({
      script: `
        export default {
          fetch: (request, env) => {
            return new Response('Hello World!');
          }
        }
      `,
      modules: true,
      r2Buckets: [`${E2E_PREFIX}r2-bucket`],
      d1Databases: [`${E2E_PREFIX}d1-database`],
    });

    // Initialize Emma
    execSync(`yarn emma init --provider cloudflare --dir ${TEST_DIR} --no-interactive`);

    // Create a form
    execSync(`yarn emma create ${FORM_NAME} --dir ${TEST_DIR}`);

    // Deploy the form
    execSync(`yarn emma deploy ${FORM_ID} --dir ${TEST_DIR}`);

    // Start Hugo server
    const websitePath = path.resolve(TEST_DIR, 'website');
    fs.copySync(path.resolve(__dirname, '../../../../website'), websitePath);
    const contentPath = path.resolve(websitePath, 'content');
    fs.ensureDirSync(contentPath);
    fs.writeFileSync(
      path.resolve(contentPath, '_index.md'),
      `---
title: "E2E Test"
---
{{< embed-form "${FORM_ID}" >}}`
    );
    hugoProcess = spawn('hugo', ['server'], { cwd: websitePath });

    // Wait for Hugo server to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    browser = await chromium.launch();
    page = await browser.newPage();
  }, 60000);

  afterAll(async () => {
    fs.removeSync(TEST_DIR);
    hugoProcess.kill();
    await browser.close();
    await mf.dispose();
  });

  it('should submit the form and store the data in D1', async () => {
    // Navigate to the Hugo page with the form
    await page.goto('http://localhost:1313');

    // Fill out the form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('textarea[name="message"]', 'Hello, world!');

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify the submission
    const d1 = await mf.getD1Database(`${E2E_PREFIX}d1-database`);
    const { results } = await d1.prepare('SELECT * FROM submissions').all();
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('John Doe');
  });
});