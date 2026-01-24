# Task 37: Implement Watch Mode for Build Command

**Date:** 2026-01-24
**Agent:** Jules

## Description

Implemented the `--watch` flag for the `emma build` command in `@xnok/emma-form-builder`. This allows the CLI to watch for changes in the form schema file and automatically rebuild the form bundle.

## Changes

- **Added Dependency:** `chokidar` (v5) to `@xnok/emma-form-builder`.
- **Refactored `build.ts`:** Extracted the core build logic into a `runBuild` function to support reusability.
- **Implemented Watch Logic:**
  - Uses `chokidar.watch` to monitor the form schema file.
  - Triggers `runBuild` on file changes.
  - Handles debouncing via `awaitWriteFinish`.
  - Prevents process exit on errors when in watch mode.

## Verification

- Verified manually using a script that creates a form, starts watch mode, modifies the form, and checks for rebuild logs.
- Ran existing tests for `form-builder` using `yarn workspace @xnok/emma-form-builder test`.

## Learnings

- `chokidar` v5 includes built-in types, so `@types/chokidar` is not needed.
- The `build` command needs to handle process exit differently in watch mode (keep alive) vs one-off build (exit on error).
