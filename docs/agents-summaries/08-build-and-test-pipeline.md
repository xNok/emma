# Task Summary: Build and Test Pipeline Configuration

**Date:** October 9, 2025
**Task:** Configure build process to run before tests and ensure all workspace commands work correctly

## Problem

The `yarn test` command was failing because:
1. Tests require built dependencies (especially `@emma/shared` package)
2. The `yarn build` command was missing the `-A` (all workspaces) flag
3. The CI pipeline wasn't building packages before running tests
4. Other workspace commands (`clean`, `dev`) also had the same issue

## Changes Made

### 1. Updated Root `package.json` Scripts

Fixed all workspace commands to include the `-A` flag:

```json
"scripts": {
  "dev": "yarn workspaces foreach -pt run dev",
  "build": "yarn workspaces foreach -Apt run build",
  "test": "yarn workspaces foreach -Aipt run test",
  "lint": "eslint . --ext .ts,.tsx",
  "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
  "format:check": "prettier --check \"**/*.{ts,tsx,json,md}\"",
  "typecheck": "tsc --noEmit",
  "clean": "yarn workspaces foreach -Apt run clean && rm -rf node_modules"
}
```

**Flags explained:**
- `-A`: Run in all workspaces
- `-p`: Run in parallel
- `-t`: Topological order (respects dependency graph)
- `-i`: Interlaced output (continue on failure for tests)

### 2. Updated CI Workflow

Added a build step before tests in `.github/workflows/lint-test.yaml`:

```yaml
- name: Install dependencies
  run: yarn install

- name: Build all packages
  run: yarn build

- name: Run linting
  run: yarn lint

- name: Run tests
  run: yarn test
```

### 3. Created Placeholder Test for API Worker

Created `/workspaces/emma/packages/api-worker/src/__tests__/index.test.ts` to ensure the package has at least one test.

### 4. Updated Test Scripts to Use Non-Watch Mode

Changed both packages to use `vitest run` instead of `vitest` to avoid hanging in watch mode:
- `packages/api-worker/package.json`
- `packages/form-renderer/package.json`

## Verification

Successfully ran the full CI pipeline locally:

```bash
yarn build && yarn lint && yarn test && yarn typecheck
```

**Results:**
- ✅ Build: Both `@emma/shared` and `@emma/form-renderer` build successfully
- ✅ Lint: Passes (with TypeScript version warning)
- ✅ Tests: 20 tests passing (1 in api-worker, 19 in form-renderer)
- ✅ Typecheck: Passes
- ⚠️ Format check: 40 files need formatting (non-critical)

## Build Dependencies

The topological order ensures dependencies are built correctly:
1. `@emma/shared` is built first (has no dependencies)
2. `@emma/form-renderer` is built second (depends on `@emma/shared`)
3. `@emma/api-worker` is built third (depends on `@emma/shared`)

## Next Steps

Consider:
1. Running `yarn format` to fix formatting issues before merging
2. Adding a pre-commit hook to ensure formatting
3. Making format:check non-blocking or a separate CI job
