# UAT Bugs and Issues

**UAT Session Date:** November 2, 2025  
**Branch:** copilot/extract-cloudflare-provider-package

This document tracks bugs and issues discovered during User Acceptance Testing that need to be addressed.

---

## ✅ Bug #1: Deploy Command Fails After Successful Build

**Priority:** High  
**Component:** CLI - Deploy Command  
**Status:** FIXED

### Description

The `emma deploy` command fails with "Form is not built" error even when the form has been successfully built and all build artifacts exist.

### Steps to Reproduce

1. Run `emma init` (works fine)
2. Run `emma create contact-form` (works fine)
3. Run `emma build contact-form-616` (works fine, shows success message)
4. Run `emma deploy contact-form-616` (fails with error)

### Expected Behavior

Deployment should proceed successfully after a successful build.

### Actual Behavior

```
✖ Deployment failed
Error: Form "contact-form-616" is not built. Run "emma build contact-form-616" first or use FormManager.ensureBuilt()
```

### Evidence

- Build command shows success: "Form bundle built successfully"
- Build artifacts exist in `~/.emma/builds/contact-form-616/`:
  - `contact-form-616-1762103200.js` (2579 bytes)
  - `emma-forms.esm.js` (23380 bytes)
  - `index.html` (523 bytes)
  - `preview.html` (4001 bytes)
  - `themes/` directory

### Root Cause Found

**File naming mismatch between FormBuilder and FormManager:**

- **FormBuilder creates:** `contact-form-616-1762103200.js` (with timestamp)
- **FormManager expects:** `contact-form-616.js` (without timestamp)

**Code locations:**

- `FormBuilder.build()` line 39: `const bundleName = timestamp ? \`${formId}-${timestamp}.js\` : \`${formId}.js\`;`
- `FormManager.needsRebuild()` line 71: `const bundlePath = path.join(buildPath, \`${formId}.js\`);`

**Impact:**

- Build process works correctly (creates files with timestamps for versioning)
- Validation always fails (looks for files without timestamps)
- Affects `deploy`, `preview`, and any command that calls `ensureBuilt()`

### Fix Applied

**Two locations needed fixing:**

1. **FormManager.needsRebuild()** - Fixed to check for timestamped filenames

   ```typescript
   // Before: const bundlePath = path.join(buildPath, `${formId}.js`);
   // After: const bundlePath = path.join(buildPath, `${formId}-${timestamp}.js`);
   ```

2. **LocalDeployment.deploy()** - Fixed to check for timestamped filenames
   ```typescript
   // Before: const bundlePath = path.join(buildPath, `${schema.formId}.js`);
   // After: const bundlePath = path.join(buildPath, `${formId}-${timestamp}.js`);
   ```

**Verification:** Both `emma deploy` and `emma preview` commands now work successfully.

---

## � Bug #2: Local Server Routing and File Serving Issues

**Priority:** High  
**Component:** Local Development Server  
**Status:** New

### Description

After fixing the deploy/preview validation, the local server has routing and file serving issues:

1. **Redirect Issue:** Clicking `http://localhost:3333/forms/contact-form-616` redirects to `http://localhost:3333`
2. **404 Errors:** Form assets fail to load with 404 errors (likely timestamped files not being served correctly)

### Steps to Reproduce

1. Create and build a form (works fine)
2. Deploy the form (works fine)
3. Access the form URL `http://localhost:3333/forms/contact-form-616`
4. **Expected:** Form displays properly
5. **Actual:** Redirect to root + 404 errors for form assets

### Technical Analysis Needed

- Local server routing logic for form URLs
- File serving for timestamped bundles (`contact-form-616-1762103200.js`)
- Static asset routing

### Impact

- Deploy/preview commands succeed but forms can't actually be viewed
- Breaks the development workflow

---

## �📝 Future Issues

_Additional bugs discovered during UAT will be added here_
