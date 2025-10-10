# Deployment Architecture (Pluggable Providers)

Date: 2025-10-10
Status: Draft

## Goals

- Clean separation of concerns between build and deploy.
- Pluggable providers: local (simulation), Cloudflare R2 now; DigitalOcean Spaces or S3-compatible later.
- Minimal user friction in the CLI with sensible defaults.

## Provider Contract

- Interface: `DeploymentProvider<TOptions, TResult>` with a single `deploy(formId, options)` method.
- Providers live under `packages/form-builder/src/deployment/`.
- The CLI selects a provider via `--target` and adapts options accordingly.

## Current Providers

- Local: Runs an Express server to serve built artifacts (existing).
- Cloudflare R2: Uploads bundle and theme assets to R2 via `wrangler r2 object put`.

## Config

`~/.emma/config.json` may include default provider settings:

```
{
  "cloudflare": {
    "bucket": "emma-forms",
    "publicUrl": "https://forms.example.com",
    "accountId": "..."
  }
}
```

## Adding a New Provider (e.g., DigitalOcean Spaces)

1. Create `src/deployment/do-spaces.ts` implementing the provider contract.
2. Use an S3-compatible SDK to `putObject` the bundle and theme assets.
3. Add CLI options (e.g., `--endpoint`, `--region`, `--access-key`, `--secret-key`, `--bucket`, `--public-url`).
4. Wire selection in `deploy.ts` when `--target do-spaces`.
5. Update docs and add a smoke test.

## Future Enhancements

- `emma init` prompts to store provider defaults.
- `emma deploy --all` to deploy multiple forms.
- Hash/versioned filenames for cache-busting and CDN invalidation support.
- Content-Type and Cache-Control metadata on uploads.
