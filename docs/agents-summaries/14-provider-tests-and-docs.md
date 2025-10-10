# Provider Tests and Docs Update

Date: 2025-10-10

## What changed

- Added Cloudflare provider unit tests using Vitest:
  - init flow (existing bucket and create bucket paths)
  - execute flow (error path guarded via process.exit mock)
  - Provider registration shape sanity checks
- Converted Jest-style test to Vitest (vi.mock/vi.fn/etc.)
- Ensured `yarn test` runs Vitest in non-watch mode by default (package script uses `vitest --run`).

## Files added/updated

- packages/form-builder/src/**tests**/deployment/cloudflare.test.ts — new tests
- packages/form-builder/package.json — test script now `vitest --run`
- docs/developer-guide/deployment-providers.md — new provider contract & Cloudflare docs
- docs/developer-guide/cli-reference.md — updated init and deploy sections to reflect provider configuration
- docs/features/hugo-shortcode.md — clarified cdnUrl and Cloudflare relation

## How to run

- Run all tests: `yarn test --run`
- Run form-builder only: `yarn workspace @emma/form-builder test --run`

## Notes

- Deployment provider may call `process.exit(1)` on unrecoverable errors; tests mock `process.exit` to avoid killing the runner.
- When mocking core modules (e.g., child_process), prefer partial mocks with `vi.importActual` for stability.
