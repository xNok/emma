# Deployment Providers

This document describes the provider contract used by the Emma CLI and details for the Cloudflare R2 provider.

## Provider Contract

A deployment provider implements the following interface (conceptual):

- name: string — Unique provider name (e.g., "cloudflare").
- description: string — Short provider description.
- register(parent, config): void — Adds the provider-specific CLI command and options.
- execute(config, formId, options): Promise<void> — Deploys the built form artifacts.
- init(config): Promise<void> — Interactive setup to capture and persist provider configuration.

Configuration is stored in the Emma config under the provider key, for example:

- cloudflare: { bucket, publicUrl, accountId }

Use `config.get('cloudflare')` and `config.set('cloudflare', value)` for access.

## Cloudflare R2

- Purpose: Upload built form bundle (and optional theme CSS) to an R2 bucket and produce public URLs.
- Required options for deployment:
  - --bucket <name>: R2 bucket name
  - --public-url <url>: Base public URL that serves objects from the bucket
- Optional options:
  - --account-id <id> (or env: CLOUDFLARE_ACCOUNT_ID)
  - --api-token <token> (or env: CLOUDFLARE_API_TOKEN)
  - --overwrite

### Init Flow

`emma init` will offer provider setup. For Cloudflare:
- Create bucket: prompts for accountId, apiToken, bucket, publicUrl, then creates the bucket via Wrangler.
- Use existing bucket: prompts for bucket, publicUrl, optional accountId.

The captured values are saved to config under `cloudflare`.

### Deployment Flow

- Ensures the form is built.
- Resolves deployment options from CLI, config, and environment.
- Uploads bundle and theme CSS to R2.
- Prints bundle and theme URLs on success.

> Note: On unrecoverable errors, the provider may call process.exit(1). Tests should mock this.
