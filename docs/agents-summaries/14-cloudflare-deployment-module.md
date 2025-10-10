# Cloudflare Deployment Module

Date: 2025-10-10

## What changed

- Added a pluggable deployment architecture in `@emma/form-builder`.
- Implemented Cloudflare R2 provider to upload bundles using Wrangler.
- Extended `deploy` command to support `--target local|cloudflare` and Cloudflare flags.
- Extended `~/.emma/config.json` schema to optionally store Cloudflare defaults.
- Added a minimal test for Cloudflare provider option validation.
- Updated README with usage and auth details.

## Files of interest

- packages/form-builder/src/deployment/cloudflare.ts
- packages/form-builder/src/commands/deploy.ts
- packages/form-builder/src/config.ts
- packages/form-builder/src/__tests__/cloudflare-deployment.test.ts
- packages/form-builder/README.md

## Next steps

- Add DigitalOcean Spaces provider with S3-compatible SDK.
- Extend `emma init` to prompt for Cloudflare defaults and write to config.
- Add end-to-end test (with mocked wrangler) for upload flow.
- Wire API Worker deployment command for D1 migrations and routes.
