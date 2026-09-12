import { defineNitroConfig } from 'nitro/config';

export default defineNitroConfig({
  // Nitro Server configuration for email integration example
  runtimeConfig: {
    cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN,
    adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  },

  // Declarative email driver configuration
  email: {
    default: 'cloudflare',
    drivers: {
      cloudflare: {
        driver: 'cloudflare',
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
        apiToken: process.env.CLOUDFLARE_API_TOKEN,
      },
    },
  },
});
