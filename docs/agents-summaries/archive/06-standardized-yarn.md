# Standardized Test Server to Use Yarn

**Date**: October 7, 2025
**Task**: Fix inconsistency between automated tests (yarn) and manual test server (npm)

## Issue

The form-renderer package uses Yarn (part of a Yarn workspace), but the test server was set up with npm, creating an inconsistent developer experience:

```bash
# Automated tests
cd packages/form-renderer && yarn test  # ✅ Yarn

# Manual test server
cd test-server && npm run dev            # ❌ npm (inconsistent!)
```

## Solution

Converted the test-server to use Yarn as a standalone project:

1. **Created empty `yarn.lock`** to make it a separate Yarn project (not part of workspace)
2. **Removed npm artifacts** (`package-lock.json`, npm's `node_modules`)
3. **Installed with Yarn** (`yarn install`)
4. **Updated all documentation** to use `yarn` commands

## Why Standalone vs Workspace?

The test-server is **not** added to the root workspace (`packages/*`) because:

- It's a development/testing tool, not a package
- It has different dependencies (Express, etc.)
- It doesn't need to be built or published
- Keeping it separate is simpler

However, it now uses Yarn consistently with the rest of the project.

## Changes Made

### Files Modified:

1. **`docs/testing/README.md`**:
   - Changed `npm install` → `yarn install`
   - Changed `npm run dev` → `yarn dev`

2. **`packages/form-renderer/test-server/README.md`**:
   - Updated quick start commands to use yarn
   - Added "(first time only)" note for install

3. **`docs/agents-summaries/05-tests-working.md`**:
   - Updated all command examples to use yarn

### Files Created:

1. **`packages/form-renderer/test-server/.gitignore`**:
   - Added node_modules, .yarn/, .pnp.\*, yarn-error.log

2. **`packages/form-renderer/test-server/yarn.lock`**:
   - Created empty file to make it standalone Yarn project

### Files Removed:

- `package-lock.json` (npm lock file)
- Old `node_modules/` (npm-installed)

## Verification

✅ **Server starts correctly with yarn:**

```bash
cd /workspaces/emma/packages/form-renderer/test-server
yarn install
yarn dev
# 🚀 Emma Test Server running!
# 📍 Open: http://localhost:3000
```

✅ **All scenarios accessible:**

- Contact Form: http://localhost:3000/test/contact
- Newsletter Signup: http://localhost:3000/test/newsletter
- Customer Survey: http://localhost:3000/test/survey
- Validation Tests: http://localhost:3000/test/validation
- Accessibility Check: http://localhost:3000/test/accessibility

## Updated Commands

### Consistent Developer Experience

**Before** (inconsistent):

```bash
# Automated tests
yarn test              # Yarn ✅

# Manual testing
npm install            # npm ❌
npm run dev            # npm ❌
```

**After** (consistent):

```bash
# Automated tests
yarn test              # Yarn ✅

# Manual testing
yarn install           # Yarn ✅
yarn dev               # Yarn ✅
```

## Benefits

1. **Consistency**: All commands use yarn throughout the project
2. **Simpler**: Developers don't need to remember which tool to use where
3. **Faster**: Yarn is generally faster than npm
4. **Workspace-aware**: Even as standalone, it respects Yarn workspace structure
5. **Better DX**: Single package manager = fewer cognitive switches

## Technical Notes

### Yarn Workspace vs Standalone

The test-server is a **standalone Yarn project** within a workspace:

- Has its own `yarn.lock` file
- Not listed in root workspace configuration
- Still uses Yarn for dependency management
- Doesn't share dependencies with workspace

This is the recommended approach for dev tools that:

- Are not packages to be published
- Have unique dependencies
- Need to be run independently

### Alternative Considered

We could have added it to the workspace:

```json
// root package.json
"workspaces": [
  "packages/*",
  "packages/form-renderer/test-server",  // Add this
  "shared"
]
```

But this would:

- Make it appear as a "package" when it's just a dev tool
- Add unnecessary complexity to the workspace
- Couple its dependencies to the workspace

## Status

✅ **Test server now uses Yarn consistently**  
✅ **All documentation updated**  
✅ **Server verified working**  
✅ **Developer experience improved**

## Next Steps

None required - this change is complete. Developers now have a consistent experience:

```bash
# Everything uses yarn! 🎉
yarn test              # Run automated tests
yarn dev               # Run test server
yarn build             # Build packages
```
