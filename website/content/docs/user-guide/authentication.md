---
title: 'Authentication'
weight: 8
---

Emma uses a token-based authentication strategy to securely interact with Cloudflare services. All authentication is handled through environment variables, ensuring that no sensitive credentials are ever stored on your local machine.

## Cloudflare API Token

To deploy and manage the API worker, D1 database, and R2 bucket, you need a Cloudflare API token with the following permissions:

- **Account** > **Workers R2 Storage**: `Edit`
- **Account** > **Workers Scripts**: `Edit`
- **Account** > **D1**: `Edit`
- **Zone** > **Workers Routes**: `Edit` (if using a custom domain)

You can create this token in the Cloudflare dashboard under **My Profile** > **API Tokens**.

## R2 S3 API Credentials

For uploading form assets to R2, you need S3-compatible API credentials. You can generate these in the R2 section of the Cloudflare dashboard by navigating to your bucket's settings and creating an R2.dev API token.

## Environment Variables

Once you have obtained your credentials, you must set them as environment variables in your shell:

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

The `emma-cli` will automatically use these environment variables when you run commands like `emma init` and `emma deploy`.
