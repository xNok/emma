# Cloudflare Worker Quickstart (API)

This package provides a Cloudflare Worker that implements the Emma Forms API based on the OpenAPI spec at `packages/api-worker/openapi.yaml`.

## Run locally

- Prerequisites: Node 18+, Yarn 4, Cloudflare Wrangler

- From repository root:

```bash
 yarn install
 yarn workspace @emma/api-worker dev
```

Wrangler will start a local server (default http://localhost:8787).

## Configuration

`packages/api-worker/wrangler.toml` controls bindings and environment variables:

- DB: D1 binding (requires a database in real deployments)
- ENVIRONMENT: environment name
- ALLOWED_ORIGINS: CORS origins
- MAX_SUBMISSION_SIZE: payload size limit
- API_KEY: when set, requests must include `X-API-Key` header.

## OpenAPI-driven routing

The worker routes requests using the OpenAPI definition. We inline the spec in `src/openapi.ts` (generated from `openapi.yaml`) and dispatch using `openapi-backend` based on `operationId`:

- `POST /submit/{formId}` -> `submitForm` -> `handleSubmit()`

Handlers perform validation with `@emma/shared` and write to D1.

## DigitalOcean Functions

The same handler code can be adapted to DigitalOcean Functions by exporting an HTTP handler function. The business logic in `handleSubmit` is platform-neutral; you mainly need to:

- Map the incoming request object to Fetch API Request
- Provide a DB client or storage alternative
- Return a standard Fetch `Response`

We plan to add a small adapter layer for DigitalOcean to reuse the same handlers.

## Tests

Run tests just for the api-worker:

```bash
 yarn workspace @emma/api-worker test
```

A basic test covers a successful submit path with a mocked D1.
# Cloudflare Quick Start

This guide helps you deploy Emma bundles to Cloudflare R2 quickly.

## Prerequisites

- Cloudflare account ID
- Cloudflare API token with R2 permissions ("Edit R2 Storage" is sufficient)
- Node.js 18+

Note on Wrangler:

- The CLI uses `npx wrangler@latest` under the hood to avoid outdated installs.
- If you use wrangler directly, ensure it’s up to date to prevent auth/feature mismatches.

## One-time setup (interactive)

Run the provider-led setup from the CLI:

- `emma init` (choose Cloudflare provider when prompted)
- Select "Create a new bucket" or "Use existing bucket"
- Provide:
  - Account ID
  - API token
  - Bucket name
  - Public URL (e.g., https://<bucket>.r2.cloudflarestorage.com)

The config is stored in `~/.emma/config.json` under `cloudflare`.

## Deploy a form

- Ensure your form schema exists (e.g., `examples/contact-form.yaml`).
- Run: `emma deploy contact-form-001 --target cloudflare` (or use interactive target selection)
- The CLI will build the bundle, upload it to R2, and print the public URLs

## Environment variables

If you prefer env vars over saved config, set:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

These are used when invoking wrangler for uploads.

## Hugo integration

Use the CDN URLs printed by the deploy step in your Hugo templates or use the provided Hugo shortcode. Ensure the `cdnUrl` you configure matches your R2 public host.

## Troubleshooting

- Wrangler auth errors: verify your token scope and `CLOUDFLARE_ACCOUNT_ID`.
- 403 on object upload: confirm bucket exists and token has R2 access.
- Tests in CI failing due to wrangler: the repository mocks wrangler in tests; ensure no test calls real wrangler.
- Pre-commit failing: run `yarn lint` and `yarn test --run` locally to see failures.

### Keeping Wrangler updated (optional)

If you prefer a local/global wrangler install, keep it current:

```bash
# Update global wrangler
npm i -g wrangler@latest

# Or use npx with a specific version explicitly
npx wrangler@latest --version
```
