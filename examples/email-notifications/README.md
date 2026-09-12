# Post-Submission Email Notifications Example

This example demonstrates how to process form submissions and send email notifications using `@xnok/emma-provider-cloudflare`.

## Architecture Overview

When a user submits a form:

1. The submission endpoint receives the payload.
2. The submission data is validated.
3. The Cloudflare email driver sends:
   - An **Admin Notification** email to your team containing full submission details and setting `replyTo` to the submitter's email address.
   - An **Auto-Responder** confirmation email to the user confirming receipt.

```
┌────────────────┐     HTTP POST /api/submit     ┌────────────────────────┐
│ Form Submitter ├──────────────────────────────►│ Nitro / H3 Event Server│
└────────────────┘                               └───────────┬────────────┘
                                                             │
                                   ┌─────────────────────────┴─────────────────────────┐
                                   │ cloudflareEmailDriver.send()                      │
                                   └────────────┬─────────────────────────┬────────────┘
                                                │                         │
                                                ▼                         ▼
                                    ┌───────────────────────┐ ┌───────────────────────┐
                                    │  Admin Notification   │ │     Auto-Responder    │
                                    │ (to admin@domain.com) │ │  (to submitter email) │
                                    └───────────────────────┘ └───────────────────────┘
```

## Setup Instructions

### Option A: Cloudflare Worker Native Binding (Recommended)

In `wrangler.toml`, add an email binding:

```toml
send_email = [
  { name = "EMAIL" }
]
```

Inside your Cloudflare Worker, `env.EMAIL` is automatically detected by `cloudflareEmailDriver()`.

### Option B: Cloudflare REST API Fallback

Set your environment variables:

```bash
export CLOUDFLARE_ACCOUNT_ID="your_account_id"
export CLOUDFLARE_API_TOKEN="your_api_token"
export ADMIN_EMAIL="admin@example.com"
```

## Code Walkthrough

In `server.ts`:

```typescript
import { cloudflareEmailDriver } from '@xnok/emma-provider-cloudflare';

const emailDriver = cloudflareEmailDriver({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
});

// Inside eventHandler...
await emailDriver.send({
  to: 'admin@example.com',
  from: 'noreply@example.com',
  replyTo: submitterEmail,
  subject: 'New Form Submission',
  text: submissionMessage,
  html: `<p>${submissionMessage}</p>`,
});
```

## Form Schema (`contact-form.yaml`)

Use the Emma CLI to deploy or serve the example form schema:

```bash
emma preview examples/email-notifications/contact-form.yaml
```
