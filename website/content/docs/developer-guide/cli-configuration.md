---
title: 'CLI Configuration'
weight: 4
---

Once you have set up your Cloudflare services and obtained the necessary credentials, you need to configure the `emma-cli` to use them. Emma uses environment variables for all authentication, so no credentials are ever stored on your local machine.

## Required Environment Variables

You need to set the following environment variables in your shell:

```bash
# For R2 access
export R2_ACCESS_KEY_ID="your-r2-access-key-id"
export R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
export R2_ACCOUNT_ID="your-cloudflare-account-id"
export R2_BUCKET_NAME="your-r2-bucket-name"
export R2_PUBLIC_URL="your-r2-public-url"

# For API worker deployment
export CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"
export CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"
```

You can add these lines to your shell's configuration file (e.g., `~/.bashrc`, `~/.zshrc`) to make them permanent.

## `emma init`

With the environment variables set, you can now run `emma init` to configure your project. This command will:

1.  Verify that all the required environment variables are set.
2.  Deploy the API worker to Cloudflare.
3.  Create the D1 database and run the necessary migrations.
4.  Create a `~/.emma/config.json` file with non-sensitive information.

```bash
emma init
```

After running this command, your project will be ready to create and deploy forms.
