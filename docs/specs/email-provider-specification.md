# Email Provider Specification

**Status:** Proposed
**Applies To:** `@xnok/emma-shared`, `@xnok/emma-api-worker`, custom email extensions

---

## 1. Overview

This specification defines the contract, interfaces, runtime expectations, and configuration requirements for email providers in the `@xnok/emma` form ecosystem. Custom email driver implementations MUST adhere to this specification to ensure cross-platform compatibility across Cloudflare Workers, Node.js, Vercel, and AWS Lambda deployments.

---

## 2. Core Provider Interface (`IEmailProvider`)

An Email Provider is responsible for outbound email transmission.

```typescript
export interface IEmailProvider {
  /** Unique provider identifier (e.g. 'cloudflare', 'resend', 'sendgrid', 'smtp', 'mock') */
  readonly name: string;

  /**
   * Send an outbound email.
   * MUST return a normalized SendEmailResult or throw an EmailProviderError.
   */
  send(options: SendEmailOptions): Promise<SendEmailResult>;

  /**
   * Verify provider credentials and configuration status.
   */
  verifyConfiguration(): Promise<boolean>;
}
```

### 2.1 Standardized Options (`SendEmailOptions`)

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
```

### 2.2 Standardized Result (`SendEmailResult`)

```typescript
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

## 3. Required Driver Implementations

| Driver ID | Runtime Compatibility | Direct Bindings / Protocol | Key Configuration Parameters |
| :--- | :--- | :--- | :--- |
| `cloudflare` | Edge (Cloudflare Workers) / HTTP | `env.EMAIL.send` / REST API | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` |
| `resend` | Universal (Edge + Node.js) | HTTPS REST API | `RESEND_API_KEY` |
| `sendgrid` | Universal (Edge + Node.js) | HTTPS REST API | `SENDGRID_API_KEY` |
| `smtp` | Node.js / Server | SMTPS / TLS Socket | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| `mock` | Universal / In-Memory | Memory Array Queue | None (optional delay simulation) |

---

## 4. Error Handling & Retry Policies

Providers MUST wrap driver-specific exceptions into standardized `EmailProviderError` objects:

```typescript
export class EmailProviderError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_CREDENTIALS' | 'RATE_LIMITED' | 'UNVERIFIED_SENDER' | 'INVALID_RECIPIENT' | 'NETWORK_ERROR' | 'UNKNOWN',
    public readonly retryable: boolean = false,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'EmailProviderError';
  }
}
```

---

## 5. Security & Domain Verification Guidelines

1. **Sender Authentication**: All outbound emails MUST originate from domains with verified **SPF** (`v=spf1 include:email-provider.com ~all`), **DKIM** keys, and **DMARC** policy records.
2. **Secret Hygiene**: Email API keys and tokens MUST NEVER be embedded in client-side form bundles (`@xnok/emma-form-renderer`). All email dispatch happens strictly on the backend API worker (`@xnok/emma-api-worker`).
