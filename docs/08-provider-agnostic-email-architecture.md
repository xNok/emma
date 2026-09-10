# Provider-Agnostic Email Architecture & Design Document

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

- **Provider Portability**: Zero hard dependency on Cloudflare Workers. Support Cloudflare Email, Resend, SendGrid, Amazon SES, NodeMailer / SMTP, and Mock drivers seamlessly.
- **Runtime Agnosticism**: Function across Nitropack multi-target serverless runtimes (Cloudflare Workers, Node.js/Express, Vercel Functions, AWS Lambda).
- **Outbound & Inbound Support**: Standardize both outbound email delivery (`sendEmail`) and inbound message handling (`receiveEmail` / webhook adapter).
- **Developer Experience**: Provide local development mocking (`MockEmailProvider`) and unit testing primitives without external dependencies.
- **Form System Integration**: Seamless hook into `@xnok/emma-api-worker` submission pipeline and form template rendering.

---

## 2. Cloudflare Email Capability Analysis & Mapping

Cloudflare Email Workers offer powerful edge capabilities:

1. **`env.EMAIL.send(options)`**: Direct Worker binding to send emails via Cloudflare Email Routing.
2. **`email(message, env, ctx)`**: Exported event handler to intercept incoming emails routed to the domain (`message.from`, `message.to`, `message.raw`, `message.forward()`, `message.reply()`).
3. **Cloudflare REST API & SMTP Endpoint**: HTTPS endpoints (`https://api.cloudflare.com/client/v4/accounts/{account_id}/email/sending/send`) and SMTPS (`smtps://smtp.mx.cloudflare.net:465`).

### Mapping Matrix: Vendor Native vs Agnostic Abstraction

| Feature              | Cloudflare Workers Native                           | Agnostic `@xnok/emma` Abstraction               | Alternative Drivers (Resend, SendGrid, SMTP) |
| :------------------- | :-------------------------------------------------- | :---------------------------------------------- | :------------------------------------------- |
| **Outbound Sending** | `env.EMAIL.send({ to, from, subject, html, text })` | `IEmailProvider.send(options)`                  | API POST (`/emails`), SMTP Transport         |
| **Inbound Handling** | `export default { email(msg, env, ctx) }`           | `IEmailReceiver.handleInbound(event)`           | Webhook Handler (`/api/v1/emails/inbound`)   |
| **Email Parsing**    | `mimetext` / raw stream parsing                     | `InboundEmailEvent` normalized payload          | Webhook JSON payload / `mailparser`          |
| **Forwarding/Reply** | `message.forward()`, `message.reply()`              | Normalized `replyTo` and delivery orchestration | API Reply / Forward calls                    |
| **Local Mocking**    | Wrangler local simulation                           | `MockEmailProvider` in-memory queue             | Local SMTP test server / Memory adapter      |

---

## 3. Core Abstraction & Interface Design

All email abstractions reside in `@xnok/emma-shared` or `@xnok/emma-api-worker/src/email/`.

```typescript
/**
 * Normalized Email Message Options for Outbound Delivery
 */
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

export interface EmailAttachment {
  filename: string;
  content: string | Uint8Array; // Base64 or binary buffer
  contentType: string;
  disposition?: 'inline' | 'attachment';
  contentId?: string;
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

/**
 * Normalized Inbound Email Payload
 */
export interface InboundEmailEvent {
  id: string;
  from: string;
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  raw?: Uint8Array | string;
  headers: Record<string, string>;
  attachments?: EmailAttachment[];
  receivedAt: Date;
}

/**
 * Outbound Email Provider Contract
 */
export interface IEmailProvider {
  readonly name: string;
  send(options: SendEmailOptions): Promise<SendEmailResult>;
  verifyConfiguration(): Promise<boolean>;
}

/**
 * Inbound Email Receiver Contract
 */
export interface IEmailReceiver {
  readonly name: string;
  parseInboundRequest(event: unknown): Promise<InboundEmailEvent>;
  handleInbound(email: InboundEmailEvent): Promise<void>;
}
```

---

## 4. Drivers & Provider Architectures

### 4.1 Cloudflare Workers Driver (`CloudflareEmailProvider`)

Utilizes the Cloudflare Worker `env.EMAIL` binding when running inside Cloudflare Workers or falls back to Cloudflare REST API when running outside Workers.

```typescript
export class CloudflareEmailProvider implements IEmailProvider {
  readonly name = 'cloudflare';

  constructor(
    private env?: {
      EMAIL?: { send: (msg: any) => Promise<{ messageId: string }> };
    },
    private apiToken?: string,
    private accountId?: string
  ) {}

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    // 1. Native Worker Binding execution path
    if (this.env?.EMAIL) {
      const res = await this.env.EMAIL.send({
        to: Array.isArray(options.to) ? options.to : [options.to],
        from:
          typeof options.from === 'string' ? options.from : options.from.email,
        subject: options.subject,
        text: options.text || '',
        html: options.html,
      });
      return { success: true, messageId: res.messageId, provider: this.name };
    }

    // 2. Cloudflare REST API fallback execution path
    if (this.apiToken && this.accountId) {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/email/sending/send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(options),
        }
      );
      const data = await response.json();
      return {
        success: data.success,
        messageId: data.result?.id || '',
        provider: this.name,
      };
    }

    throw new Error(
      'Cloudflare Email Provider misconfigured: Missing EMAIL binding or API token.'
    );
  }

  async verifyConfiguration(): Promise<boolean> {
    return Boolean(this.env?.EMAIL || (this.apiToken && this.accountId));
  }
}
```

### 4.2 Resend Driver (`ResendEmailProvider`)

High-performance HTTPS API driver compatible with Edge and Node.js runtimes.

```typescript
export class ResendEmailProvider implements IEmailProvider {
  readonly name = 'resend';

  constructor(private apiKey: string) {}

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
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
        reply_to: options.replyTo,
      }),
    });
    const data = await res.json();
    return {
      success: res.ok,
      messageId: data.id,
      provider: this.name,
      rawResponse: data,
    };
  }

  async verifyConfiguration(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.startsWith('re_'));
  }
}
```

### 4.3 SMTP Driver (`SmtpEmailProvider`) & Mock Driver (`MockEmailProvider`)

- **`SmtpEmailProvider`**: Uses standard Node.js SMTP transport for traditional server deployments.
- **`MockEmailProvider`**: In-memory queue storing dispatched emails for local testing and CLI development.

---

## 5. Inbound Email Routing & Nitropack Serverless Integration

Inbound email delivery varies across cloud providers:

- **Cloudflare**: Native `email(message, env, ctx)` handler.
- **Resend / SendGrid / Postmark**: HTTP POST Webhooks (`/api/v1/emails/inbound`).

To maintain provider-agnostic architecture, `@xnok/emma-api-worker` wraps both mechanisms into unified H3 event handlers.

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
│                  EmailReceiverAdapter.normalize(event)                  │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              InboundEmailEvent (Normalized Payload)                    │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│          Form Workflow Engine (Notification / Support Ticket)           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Architecture Decision Record (ADR)

### ADR 0008: Strategy / Driver Pattern for Email Integration

#### Context & Problem

Form notifications and transactional emails require an email service. Direct binding to Cloudflare Email Workers (`env.EMAIL.send`) binds the application strictly to Cloudflare infrastructure, preventing deployment on Vercel, Node.js servers, or AWS.

#### Decision Drivers

1. **Portability**: Must support multiple cloud targets without code changes.
2. **Unified API**: Single `sendEmail()` interface across all packages.
3. **Local DX**: Seamless offline testability without mock cloud APIs.
4. **Security**: Centralized verification of SPF/DKIM/DMARC configurations.

#### Evaluated Alternatives

1. **Direct Cloudflare `env.EMAIL` Binding**: Rejected due to Cloudflare vendor lock-in.
2. **Generic NodeMailer Only**: Rejected because NodeMailer relies on Node.js `net`/`tls` sockets incompatible with Edge runtimes (Cloudflare Workers, Vercel Edge).
3. **Strategy / Driver Architecture with HTTP API Fallbacks**: **Selected**. Uses native fetch-compatible REST APIs for Edge environments, bindings where available, and SMTP for traditional Node.js.

#### Decision Outcome

Adopt the Strategy / Driver architecture with `IEmailProvider` and `IEmailReceiver`. `@xnok/emma-api-worker` dynamically instantiates the appropriate driver based on environment variables (`EMAIL_PROVIDER=cloudflare|resend|sendgrid|smtp|mock`).

---

## 7. Configuration Schema & Environment Variables

```bash
# General Email Selection
EMAIL_PROVIDER="resend" # Options: cloudflare | resend | sendgrid | smtp | mock
EMAIL_FROM_ADDRESS="notifications@example.com"
EMAIL_FROM_NAME="Emma Form System"

# Cloudflare Email Provider Settings
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_API_TOKEN="your-api-token"

# Resend Settings
RESEND_API_KEY="re_123456789"

# SendGrid Settings
SENDGRID_API_KEY="SG.123456789"

# SMTP Settings (Node.js target)
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT="587"
SMTP_USER="username"
SMTP_PASS="password"
```

---

## 8. Implementation Roadmap

- **Phase 1 (Core Interfaces & Mock Driver)**: Add `IEmailProvider`, `SendEmailOptions`, and `MockEmailProvider` to `@xnok/emma-shared`.
- **Phase 2 (Cloudflare & Resend Drivers)**: Implement `CloudflareEmailProvider` and `ResendEmailProvider` in `@xnok/emma-api-worker`.
- **Phase 3 (Inbound Webhook Routing)**: Create H3 event handler `/api/v1/emails/inbound` and Cloudflare `email()` handler adapter.
- **Phase 4 (Form Integration)**: Add email notification triggers on form submission in `@xnok/emma-api-worker`.
