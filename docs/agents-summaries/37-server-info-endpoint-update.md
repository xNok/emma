# Update Server Info Endpoint

## Task Overview

The task was to update the `/api/info` endpoint in the local deployment server (`packages/form-builder/src/local-deployment.ts`) to list available forms.

## Changes

- Modified `LocalDeployment.startServer` to implement the `/api/info` endpoint logic.
- The endpoint now returns a `forms` array containing objects with:
  - `id`: Form ID
  - `name`: Form name (from schema)
  - `url`: Form preview URL
  - `apiUrl`: API submission URL
  - `bundleUrl`: Form bundle URL
- Updated `packages/form-builder/src/__tests__/local-deployment.test.ts` to verify the new response structure.

## Verification

- Ran unit tests in `packages/form-builder/src/__tests__/local-deployment.test.ts`.
- Verified that `should serve server info` test case passes and correctly asserts the `forms` array content.

## Learnings

- The `LocalDeployment` class uses `EmmaConfig` to manage form schemas and `express` for the server.
- The `startServer` method sets up the express app and endpoints, utilizing `options` from its scope for host and port information.
