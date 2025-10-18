import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:8000/preview.html');
  await page.screenshot({ path: 'website/static/showcase/contact-form-screenshot.png' });
  await browser.close();
})();