---
'@xnok/emma-form-builder': patch
---

Fix asset loading 404 errors in local deployment

Forms deployed locally failed to load JavaScript bundles and CSS assets with 404 errors. The issue was caused by incorrect URL resolution when forms were served without trailing slashes. The browser treated `/forms/test-form-123` as a file rather than a directory, causing relative URLs to resolve incorrectly.

**Changes:**

- Added automatic redirect from `/forms/:formId` to `/forms/:formId/` for proper URL resolution
- Enhanced asset serving route to detect trailing-slash-only requests and serve `index.html`
- Updated form URLs in deployment results to include trailing slashes

This fix ensures all form assets (JavaScript bundles, CSS files, ESM modules) load correctly in the browser during local development.
