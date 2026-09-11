# Provider-Agnostic Email Architecture & Design Document (Nitro-Native Extension Model)

**Document Number:** 08
**Date:** March 30, 2026
**Status:** Draft / Proposed Architecture Decision Record
**Previous:** [07-nitro-h3-multi-provider-architecture.md](./07-nitro-h3-multi-provider-architecture.md)

---

## 1. Executive Summary & Goals

### 1.1 Context

The `@xnok/emma` ecosystem provides a form builder and form submission handling framework (`@xnok/emma-api-worker`, `@xnok/emma-form-builder`, `@xnok/emma-form-renderer`). As part of form workflow automation, form authors require email integration to:

1. Send submission notification emails to site owners/administrators.
2. Send transactional auto-responder or confirmation emails to form submitters.
3. Handle incoming email routing (e.g., support ticket creation, email verification, or inbound webhooks).

Cloudflare provides first-class native email capabilities through **Cloudflare Email Routing** and **Cloudflare Email Workers** (`env.EMAIL.send` binding and `email()` event handler). However, adhering to the core design principles established in [06-provider-system-architecture.md](./06-provider-system-architecture.md) and [07-nitro-h3-multi-provider-architecture.md](./07-nitro-h3-multi-provider-architecture.md), `@xnok/emma` MUST remain **100% provider-agnostic**.

### 1.2 Goals

- **Nitro-Native Semantics**: Mirror Nitro core primitives (`useStorage()`, `useDatabase()`) by designing `useEmail()` and `defineEmailDriver()` as a Nitro extension module.
- **Upstream Contribution Ready**: Design the architecture as a standalone, framework-agnostic package (`unemail` / `nitro-email`) that can eventually be contributed back to the UnJS / Nitro ecosystem.
- **Provider Portability**: Support Cloudflare Email Workers, Resend, SendGrid, Amazon SES, NodeMailer / SMTP, and Mock drivers seamlessly without runtime lock-in.
- **Runtime Agnosticism**: Function across Nitropack multi-target serverless runtimes (Cloudflare Workers, Node.js/Express, Vercel Functions, AWS Lambda).
- **Outbound & Inbound Support**: Standardize both outbound email delivery (`useEmail().send()`) and inbound message handling (`receiveEmail` / webhook adapter).

---

## 2. Nitro-Native Architecture & Extension Model

To seamlessly integrate with Nitro and provide a developer experience identical to `useStorage()` (Unstorage) and `useDatabase()` (Un-db), we model email integration using Nitro's composable and driver factory conventions.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Nitro Server / API Worker Runtime                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│    Nitro Config (nitro.config.ts)                                        │
│    └── email: { default: 'resend', drivers: { resend: ..., cf: ... } }  │
│                                                                         │
│    Runtime Composable: useEmail('resend') / useEmail()                 │
│    ├── .send(options)                                                  │
│    └── .verify()                                                       │
│                                                                         │
│    Driver Registry (defineEmailDriver)                                  │
│    ├── cloudflareDriver()  ──► env.EMAIL.send / REST API                │
│    ├── resendDriver()      ──► HTTPS REST API                           │
│    ├── sendgridDriver()    ──► HTTPS REST API                           │
│    ├── smtpDriver()        ──► SMTPS / TLS Socket                       │
│    └── mockDriver()        ──► In-Memory Queue (Testing/CLI)            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Nitro Configuration Integration (`nitro.config.ts`)

In `nitro.config.ts` or `emma.config.ts`, email drivers are mounted under the `email` options key, exactly like storage drivers:

```typescript
// nitro.config.ts
import { defineNitroConfig } from 'nitro/config';

export default defineNitroConfig({
  // Nitro-style email configuration
  email: {
    default: process.env.EMAIL_PROVIDER || 'resend',
    drivers: {
      cloudflare: {
        driver: 'cloudflare',
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
        apiToken: process.env.CLOUDFLARE_API_TOKEN,
      },
      resend: {
        driver: 'resend',
        apiKey: process.env.RESEND_API_KEY,
      },
      smtp: {
        driver: 'smtp',
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      mock: {
        driver: 'mock',
      },
    },
  },
});
```

### 2.2 The `useEmail()` Composable Primitive

Within Nitro event handlers (`/api/submit`), developers use `useEmail()` to access the configured email driver:

```typescript
// server/api/submit.ts
import { eventHandler, readBody } from 'h3';
import { useEmail } from 'nitro/email'; // or @xnok/emma-api-worker/email

export default eventHandler(async (event) => {
  const body = await readBody(event);
  const email = useEmail(); // Uses default driver from nitro.config.ts

  await email.send({
    to: 'admin@example.com',
    from: 'noreply@example.com',
    subject: `New Form Submission: ${body.formId}`,
    html: `<h1>Submission Received</h1><pre>${JSON.stringify(body.data, null, 2)}</pre>`,
  });

  return { success: true };
});
```

---

## 3. Driver Interface & `defineEmailDriver` Factory

Following UnJS/Unstorage conventions, each driver is defined using `defineEmailDriver`:

```typescript
/**
 * Driver Factory Pattern (UnJS style)
 */
export interface EmailDriver {
  name: string;
  send(options: SendEmailOptions): Promise<SendEmailResult>;
  verify?(): Promise<boolean>;
}

export type EmailDriverFactory<Options> = (options: Options) => EmailDriver;

export function defineEmailDriver<Options>(
  factory: EmailDriverFactory<Options>
): EmailDriverFactory<Options> {
  return factory;
}
```

### 3.1 Cloudflare Driver (`cloudflareDriver`)

Supports native Worker bindings (`env.EMAIL.send`) when deployed on Cloudflare Workers, and falls back to Cloudflare REST API for edge/node targets outside Workers:

```typescript
import { defineEmailDriver } from './driver';

export interface CloudflareDriverOptions {
  accountId?: string;
  apiToken?: string;
}

export const cloudflareDriver = defineEmailDriver<CloudflareDriverOptions>(
  (opts) => {
    return {
      name: 'cloudflare',
      async send(options) {
        // Access global env inside Cloudflare Workers
        const globalEnv = (globalThis as any).__env__ || (globalThis as any);

        // 1. Native Worker binding
        if (globalEnv?.EMAIL) {
          const res = await globalEnv.EMAIL.send({
            to: Array.isArray(options.to) ? options.to : [options.to],
            from:
              typeof options.from === 'string'
                ? options.from
                : options.from.email,
            subject: options.subject,
            text: options.text || '',
            html: options.html,
          });
          return {
            success: true,
            messageId: res.messageId,
            provider: 'cloudflare',
          };
        }

        // 2. REST API fallback
        if (opts.accountId && opts.apiToken) {
          const res = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${opts.accountId}/email/sending/send`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${opts.apiToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(options),
            }
          );
          const data = await res.json();
          return {
            success: data.success,
            messageId: data.result?.id || '',
            provider: 'cloudflare',
          };
        }

        throw new Error(
          'Cloudflare email driver missing EMAIL binding or accountId/apiToken'
        );
      },
    };
  }
);
```

### 3.2 Resend Driver (`resendDriver`)

```typescript
export const resendDriver = defineEmailDriver<{ apiKey: string }>((opts) => ({
  name: 'resend',
  async send(options) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:
          typeof options.from === 'string'
            ? options.from
            : `${options.from.name || ''} <${options.from.email}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });
    const data = await res.json();
    return {
      success: res.ok,
      messageId: data.id,
      provider: 'resend',
      rawResponse: data,
    };
  },
}));
```

---

## 4. Inbound Email Handling & Nitro Webhook Integration

Inbound email handling uses a Nitro / H3 event handler adapter:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Inbound Email Ingestion                          │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
┌────────────────────────────────┐               ┌──────────────────┐
│ Cloudflare Worker email() Event│               │ HTTP Webhook POST│
└────────────────────────────────┘               └──────────────────┘
                 │                                         │
                 ▼                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  createEmailInboundHandler(receiver)                    │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              InboundEmailEvent (Normalized Payload)                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Upstream Contribution Strategy (`unemail` Proposal)

By designing this module to follow UnJS standards (`unstorage`, `un-db`, `unhead`):

1. **Standalone Package (`unemail`)**: Implement the core types, `defineEmailDriver`, and drivers (`resendDriver`, `cloudflareDriver`, `smtpDriver`, `mockDriver`) in a decoupled workspace package.
2. **Nitro Core Primitive (`useEmail()`)**: Provide a Nitro plugin that registers `useEmail()` into Nitro server context.
3. **Open Source Contribution**: Submit `unemail` to the UnJS ecosystem as a candidate for standard Nitro mailing abstraction.

---

## 6. Architecture Decision Record (ADR)

### ADR 0008: Nitro-Native Composable Architecture (`useEmail`) for Email Integration

#### Context & Problem

Direct Cloudflare `env.EMAIL` binding causes vendor lock-in. Custom ad-hoc wrappers create unnecessary cognitive overhead for developers familiar with Nitro's composables like `useStorage()` and `useDatabase()`.

#### Decision

Adopt Nitro-native semantics:

- Provide `useEmail()` composable for runtime email access.
- Provide `defineEmailDriver()` for UnJS-compliant driver definitions.
- Support `nitro.config.ts` configuration under the `email` key.

#### Consequences & Benefits

- **Zero Vendor Lock-in**: Works across Cloudflare, Resend, SendGrid, and SMTP.
- **Consistent DX**: Developer experience matches native Nitro primitives.
- **Upstream Contribution**: Positioned for future integration into Nitropack / UnJS core.

---

## 7. Implementation Roadmap

- **Phase 1 (Unemail Primitives)**: Define `defineEmailDriver`, `useEmail()`, and `mockDriver` in `@xnok/emma-shared`.
- **Phase 2 (Drivers & Nitro Plugin)**: Implement `cloudflareDriver`, `resendDriver`, and Nitro auto-import plugin.
- **Phase 3 (Form Notification Wiring)**: Integrate `useEmail()` into `@xnok/emma-api-worker` submission pipeline.
- **Phase 4 (Upstream Documentation)**: Draft RFC for UnJS / Nitro community submission.
