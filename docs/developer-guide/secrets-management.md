# Secrets Management with 1Password

This project uses 1Password for secure secrets management. Instead of storing sensitive credentials in `.env` files, we load them from 1Password using the 1Password CLI.

## Prerequisites

1. **1Password Service Account Token**: You must set this in EVERY new terminal session

   ```bash
   export OP_SERVICE_ACCOUNT_TOKEN=your_service_account_token
   ```

   💡 **Tip**: To avoid setting this every time, add it to your Codespace secrets:
   - Go to your Codespace settings
   - Add `OP_SERVICE_ACCOUNT_TOKEN` as a secret
   - It will be automatically available in all terminals

2. **1Password CLI**: Already installed in this dev container (`op` command)

## Usage

### Quick Start (Every Terminal Session)

```bash
# 1. Set your 1Password service account token (if not in Codespace secrets)
export OP_SERVICE_ACCOUNT_TOKEN=your_token_here

# 2. Load all secrets from 1Password
source ./bin/load-secrets.sh

# 3. Navigate to api-worker and run dev
cd packages/api-worker
yarn dev:cloudflare
```

### Option 1: Load secrets manually

```bash
# From project root, after setting OP_SERVICE_ACCOUNT_TOKEN
source ./bin/load-secrets.sh
```

This exports environment variables like `CLOUDFLARE_API_TOKEN` that you can use in subsequent commands.

### Option 2: Use the wrapper script

```bash
cd packages/api-worker
yarn dev:cloudflare:1p
```

**Note**: The wrapper script requires `OP_SERVICE_ACCOUNT_TOKEN` to be set first.

### Adding New Secrets

1. **Add the secret to 1Password** in the `xnok/emma` vault

2. **Update `bin/load-secrets.sh`** to load the new secret:

   ```bash
   # Add this line in the bin/load-secrets.sh script
   load_secret "MY_SECRET_NAME" "op://xnok/emma/item-name/field-name" true
   ```

3. **Use the secret** in your application:
   ```bash
   echo $MY_SECRET_NAME
   ```

## Available Secrets

Currently configured secrets:

- `CLOUDFLARE_API_TOKEN` - Required for Cloudflare deployments and remote dev
  - Loaded from: `op://xnok/emma/CLOUDFLARE_API_TOKEN/password`

## Creating Wrapper Scripts

For package-specific workflows, create wrapper scripts that source the secrets:

```bash
#!/bin/bash
set -e

# Load secrets
source "$(dirname "$0")/../../bin/load-secrets.sh"

# Run your command
yarn your-command
```

## Environment-Specific Usage

You can load different secrets for different environments by modifying the `VAULT` variable or creating environment-specific secret items in 1Password:

```bash
# For UAT/Integration tests
load_secret "DATABASE_URL" "op://xnok/emma/database-uat/url" false

# For production
load_secret "DATABASE_URL" "op://xnok/emma/database-prod/url" true
```

## Security Notes

- Never commit the `OP_SERVICE_ACCOUNT_TOKEN` to git
- The token should be set in your Codespace secrets or local environment
- Secrets are only loaded into the current shell session
- Use `source` to load secrets in your current shell
- Execute the script directly to create a sub-shell with secrets

## Troubleshooting

**"Failed to load required secret"**

- Verify the secret exists in 1Password: `op item list --vault emma`
- Check the item details: `op item get "ITEM_NAME" --vault emma`
- Ensure `OP_SERVICE_ACCOUNT_TOKEN` is set

**"1Password CLI (op) is not installed"**

- The CLI should be pre-installed in the dev container
- Check with: `which op`
