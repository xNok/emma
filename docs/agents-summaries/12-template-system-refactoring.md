# Template System Refactoring

**Date:** October 10, 2025  
**Agent:** GitHub Copilot  
**Task:** Refactor FormBuilder to use external templates instead of inline code

## Summary

Successfully refactored the FormBuilder architecture to address a critical design flaw where form bundles contained embedded duplicate rendering logic instead of leveraging the existing `@emma/form-renderer` package.

## Changes Made

### 1. Extracted Inline Templates

- **Before**: Templates were hardcoded strings inside `generateFormBundle()` and `generateTestHtml()` methods
- **After**: Created external template files with placeholder tokens:
  - `src/templates/bundle.template.js` - JavaScript bundle template
  - `src/templates/preview.template.html` - HTML preview template

### 2. Refactored Bundle Architecture

- **Before**: Each form bundle contained ~10.7KB of duplicated `EmbeddedFormRenderer` code
- **After**: Bundles now initialize the shared `@emma/form-renderer` runtime (~2.9KB, 73% reduction)
- **Runtime Dependency**: Form bundles now require `emma-forms.min.js` to be loaded first

### 3. Build Infrastructure Updates

- Added `scripts/copy-templates.mjs` to copy templates to `dist/templates` during build
- Updated `package.json` build script: `tsc && node scripts/copy-templates.mjs`
- Added `copyRendererRuntime()` method to copy runtime to each form build
- Template resolution with fallback: `src/templates` → `dist/templates`

### 4. Template System

- Placeholder tokens: `__FORM_SCHEMA__`, `__FORM_ID__`, `__THEME__`, `__API_ENDPOINT__`, etc.
- Global regex replacement for consistent substitution
- `readTemplate()` method with dist fallback support

### 5. Updated Preview HTML

- Now loads runtime script before form-specific bundle:
  ```html
  <script src="/forms/__FORM_ID__/emma-forms.min.js"></script>
  <script src="/forms/__FORM_ID__/__FORM_ID__.js"></script>
  ```

## Test Updates

Updated all 59 tests to reflect the new architecture:

- Changed expectations from embedded renderer code to runtime initialization
- Updated local deployment tests for new bundle structure
- Fixed template placeholder replacement in HTML debug links

## Benefits

### Single Source of Truth

- Form rendering logic centralized in `@emma/form-renderer`
- No more duplicate/divergent implementations

### Bundle Size Reduction

- Form-specific bundles: ~10.7KB → ~2.9KB (73% reduction)
- Shared runtime: ~11.4KB (loaded once, cached across forms)

### Maintainability

- Templates are lintable, version-controllable files
- Rendering logic changes propagate to all forms automatically
- Template customization without code changes

### Developer Experience

- Templates can be syntax-highlighted and validated
- Clear separation between form data and rendering logic
- Easier debugging with readable template files

## Files Modified

### New Files

- `packages/form-builder/src/templates/bundle.template.js`
- `packages/form-builder/src/templates/preview.template.html`
- `packages/form-builder/scripts/copy-templates.mjs`

### Modified Files

- `packages/form-builder/src/form-builder.ts` - Added template system
- `packages/form-builder/src/local-deployment.ts` - Updated bundle filename references
- `packages/form-builder/package.json` - Added postbuild template copy
- All test files - Updated expectations for new architecture

## Technical Details

### Bundle Template Structure

```javascript
(function () {
  'use strict';
  const FORM_SCHEMA = __FORM_SCHEMA__;

  function init() {
    if (!window.EmmaForms?.FormRenderer) {
      console.error('[Emma] FormRenderer runtime not found');
      return;
    }
    // Initialize forms using shared renderer...
  }

  // Auto-init and global API
})();
```

### Runtime Dependencies

Forms now require the shared runtime to be loaded first:

1. `emma-forms.min.js` (shared runtime, ~11.4KB)
2. `{formId}.js` (form-specific bundle, ~2.9KB)

## Validation

- ✅ All 59 tests passing
- ✅ TypeScript compilation successful
- ✅ Bundle generation and preview working
- ✅ Local deployment serving correct assets
- ✅ Form rendering with shared runtime functional

## Next Steps

The refactoring is complete and functional. Future improvements could include:

- ESLint configuration for better CLI code quality
- Template validation during build
- Bundle size optimization for runtime
- Template customization system for different use cases
