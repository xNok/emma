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
- Run: `emma deploy cloudflare --form-id contact-form` (or via interactive prompts)
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
