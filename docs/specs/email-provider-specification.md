# Email Provider Specification (Nitro / UnJS Extension Specification)

**Status:** Proposed
**Applies To:** `@xnok/emma-shared`, `@xnok/emma-api-worker`, Nitro extension modules (`unemail`)

---

## 1. Overview

This specification defines the contract, interfaces, driver factory patterns, and configuration requirements for email providers in the `@xnok/emma` form ecosystem. Designed as a Nitro server extension (`unemail`), custom driver implementations MUST adhere to UnJS driver conventions (`defineEmailDriver`) to ensure compatibility across Cloudflare Workers, Node.js, Vercel, and AWS Lambda deployments.

---

## 2. Nitro Runtime Composable (`useEmail`)

The primary runtime interface available within Nitro server handlers:

```typescript
export function useEmail(driverName?: string): EmailDriver;
```

---

## 3. Driver Factory & Interface Specification (`defineEmailDriver`)

Every email driver is produced via a factory created with `defineEmailDriver`:

```typescript
export interface EmailDriver {
  /** Unique driver identifier (e.g. 'cloudflare', 'resend', 'sendgrid', 'smtp', 'mock') */
  readonly name: string;

  /**
   * Send an outbound email.
   * MUST return a normalized SendEmailResult or throw an EmailProviderError.
   */
  send(options: SendEmailOptions): Promise<SendEmailResult>;

  /**
   * Verify provider credentials and configuration status.
   */
  verify?(): Promise<boolean>;
}

export type EmailDriverFactory<Options> = (options: Options) => EmailDriver;

export function defineEmailDriver<Options>(
  factory: EmailDriverFactory<Options>
): EmailDriverFactory<Options>;
```

---

## 4. Nitro Configuration Schema (`nitro.config.ts`)

```typescript
export interface NitroEmailConfig {
  default?: string;
  drivers?: Record<string, { driver: string; [key: string]: any }>;
}
```

---

## 5. Standardized Types (`SendEmailOptions` & `SendEmailResult`)

```typescript
export interface SendEmailOptions {
  to: string | string[];
  from: string | { name?: string; email: string };
  replyTo?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  tags?: Record<string, string>;
}

export interface SendEmailResult {
  success: boolean;
  messageId: string;
  provider: string;
  rawResponse?: unknown;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}
```

---

## 6. Upstream Ecosystem Alignment

This specification is modeled after Nitro's `unstorage` and `un-db` packages, enabling future submission as an upstream UnJS core package (`unemail` / `nitro-email`).
