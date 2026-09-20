---
title: "Breaking Free from Form SaaS: Building Multi-Cloud Static Forms with Nitro and UnJS"
date: 2026-09-20T20:45:00Z
draft: true
description: "How the search for a lightweight, vendor-agnostic contact form solution for static Hugo websites led to the UnJS ecosystem, Nitro server engine, and Project Emma."
tags: ["nitro", "unjs", "hugo", "serverless", "cloudflare", "emma", "forms"]
---
I wanted to have forms and email management for my side projects. While there are a lot of email marketing and form backend tools out there, I thought they were all overpriced for the simple static Hugo websites I maintain. 

I started looking at Cloudflare's offerings (Workers, D1, KV), but I was scared to commit to a single provider when building my solutions.

I want something simple: whenever I create a new small website and want a contact page, I just want to run a CLI and have the contact page ready. I don't need to manage high traffic or a large number of users, and the solution should fit in most cloud providers' free tiers—from Cloudflare to GCP, AWS, Azure, or DigitalOcean.

```mermaid
flowchart TD
    A["Static Site (Hugo)"] --> B{"Needs Form & Email Management"}
    B -->|"Option 1"| C["Overpriced SaaS Tools\n- Expensive monthly fees\n- Overkill for side projects\n- Third-party branding"]
    B -->|"Option 2"| D["Single Cloud Provider\n- Scared to commit/lock-in\n- Proprietary APIs\n- Hard to move"]
    B -->|"My Goal"| E["Simple CLI + Multi-Cloud Free Tier\n- Run CLI -> Contact page ready\n- Cloudflare, GCP, AWS, Azure, DigitalOcean\n- Zero maintenance / zero cost"]

    classDef ideal fill:#e0f2fe,stroke:#0284c7,stroke-width:2px;
    class E ideal;
```

But how to achieve that? 

I immediately thought about WebAssembly (WASM) and compiling the runtime to WASM for the form. But then came the issue of storage: a submission needs to be persisted either in a database or a blob store (after all, we don't care that much which one, as long as we can retrieve it later).

This is when **Nitro** and the **UnJS** ecosystem came into my line of sight.

---

## Enter UnJS and Nitro: Universal JavaScript Done Right

If you haven't explored the [UnJS](https://unjs.io/) ecosystem yet, it represents one of the most elegant architectural movements in modern JavaScript and TypeScript tooling.

### What is UnJS?
**UnJS** (Unified JavaScript Tools) is a collection of modular, compact, zero-dependency utility libraries designed from the ground up to be **runtime-agnostic**. 

Instead of writing code that assumes a standard Node.js environment (with `fs`, `http`, or global `process`), UnJS packages are built to run seamlessly across:
- **Node.js & Bun**
- **Deno**
- **Cloudflare Workers & Vercel Edge** (V8 Isolates)
- **AWS Lambda & GCP Cloud Functions**
- **Browsers & Web Workers**

Some of the standout packages in the ecosystem include:
- **`h3`**: An ultra-fast, composable, runtime-agnostic HTTP framework (the engine underneath Nitro).
- **`unstorage`**: A unified key-value and blob storage layer with 30+ driver adapters (Memory, LocalStorage, Redis, Cloudflare KV/R2, S3, MongoDB, etc.).
- **`unenv`**: Configurable polyfills that let Node.js modules run in non-Node environments like Cloudflare Workers.
- **`consola`**, **`c12`**, **`ofetch`**: Universal logging, configuration loaders, and HTTP clients.

### What is Nitro?
**[Nitro](https://nitro.build/)** is the next-generation web server engine built on top of UnJS (famous for powering Nuxt, but completely usable as a standalone backend framework).

Nitro acts as both a **runtime framework** and a **smart build system**:

```mermaid
flowchart TD
    subgraph Source["Universal Source Code"]
        API["H3 API Handlers\n(Validation, Honeypot, Storage logic)"]
    end

    subgraph BuildEngine["Nitro Engine"]
        N["nitro build --preset <target>"]
    end

    subgraph Targets["Deployment Targets"]
        CF["Cloudflare Workers\n(V8 Isolates + D1 / KV)"]
        NODE["Node.js / Docker\n(Standard HTTP + SQLite / Postgres)"]
        AWS["AWS Lambda\n(Serverless Handler + DynamoDB / S3)"]
        VERCEL["Vercel Edge / Deno\n(Edge Runtime)"]
    end

    API --> N
    N -->|"preset: cloudflare-worker"| CF
    N -->|"preset: node-server"| NODE
    N -->|"preset: aws-lambda"| AWS
    N -->|"preset: vercel-edge"| VERCEL
```

1. **Preset-driven Bundling:** You write your API routes once using standard Web Standards (`Request` / `Response` or `h3` handlers). With a single flag (`--preset cloudflare-worker`, `--preset node-server`, `--preset aws-lambda`), Nitro bundles, treeshakes, and polyfills your app for that target.
2. **Zero-Config Storage:** Through `unstorage`, caching and persistence can switch from in-memory (for local development) to Cloudflare KV/D1 or AWS DynamoDB/S3 with a simple configuration change.
3. **Instant Cold Starts & Tiny Footprints:** Because it strips out unnecessary runtimes and polyfills, the generated bundles are tiny (~90 KB) and cold-start in under 10ms on edge networks.

---

## Bringing It to Life: Project Emma

Armed with Nitro and UnJS, I set out to build **Emma**—an embeddable form system tailored for Hugo (and other static sites) with a developer-first CLI.

### The System Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    actor User as Site Visitor
    participant CLI as Emma CLI (@emma/form-builder)
    participant Hugo as Hugo Website
    participant FormJS as Client Bundle (@emma/form-renderer)
    participant API as Nitro API Worker (@emma/api-worker)
    participant Storage as Storage (D1 / SQL / KV)

    Dev->>CLI: emma create contact-form
    CLI-->>Dev: Generates schema & bundles JS
    Dev->>Hugo: {{< embed-form "contact-form-001" >}}
    
    User->>Hugo: Loads contact page
    Hugo->>FormJS: Renders form & client-side validation
    User->>FormJS: Submits form
    FormJS->>API: POST /api/submit/contact-form-001
    API->>API: Validate schema & check honeypot
    API->>Storage: Persist submission record
    API-->>FormJS: 200 OK (Success message)
    FormJS-->>User: Displays thank you state
```

### The Developer Experience

Instead of signing up for dashboards and copying complex embed scripts, the entire workflow lives in your terminal:

```bash
# 1. Initialize Emma in your Hugo site
$ emma init

# 2. Interactively create your contact form
$ emma create contact-form
? Form display name: Contact Us
? Select a theme: default
? Add field 1: Text Input > Your Name (required)
? Add field 2: Email > Email Address (required)
? Add field 3: Textarea > Message (required)
? Enable spam protection (honeypot)? Yes
✓ Form created: contact-form-001

# 3. Build & test locally
$ emma build contact-form-001
$ emma deploy contact-form-001
$ emma preview contact-form-001
```

In your Hugo markdown content, you simply drop the shortcode:

```markdown
---
title: "Get in Touch"
---

Feel free to reach out to us using the form below:

{{< embed-form "contact-form-001" >}}
```

### How Nitro Made the Backend Truly Multi-Provider

Under the hood of `@emma/api-worker`, the API endpoint is written universally using `h3`:

```typescript
// packages/api-worker/src/server.ts
import { createApp, defineEventHandler, readBody, createError } from 'h3';
import { SubmissionSchema } from './validation';

const app = createApp();

app.use('/api/submit/:formId', defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  // 1. Zod Validation & Honeypot Check
  const result = SubmissionSchema.safeParse(body);
  if (!result.success || body._gotcha) {
    throw createError({ statusCode: 400, message: 'Invalid submission' });
  }

  // 2. Access the abstracted repository injected into event context
  const repo = event.context.submissionRepository;
  await repo.saveSubmission(event.context.params.formId, result.data);

  return { success: true, message: 'Submission received!' };
}));

export default app;
```

When building for local development or a self-hosted server:
```bash
yarn nitro build --preset node-server
```

When deploying to Cloudflare Workers:
```bash
yarn nitro build --preset cloudflare-worker
```

The exact same business logic runs locally on SQLite or in-memory, and in production on Cloudflare D1/KV, AWS Lambda, or any Node-compatible host—without changing a single route handler.

---

## State of the Experimentation & What's Next

Where does Emma stand today?

- **Local CLI Workflow:** Fully operational. Interactive form generation (13+ field types), schema validation, asset bundling, and local preview servers work smoothly.
- **Nitro & H3 Migration:** Completed. The API worker has been decoupled from Cloudflare-specific APIs into universal H3 handlers and Nitro presets.
- **Provider System:** The provider abstraction layer is modularized. The Cloudflare provider (Workers + D1 + KV) is implemented, and the architecture is ready for community drivers (Node/Docker, AWS Lambda, S3).
- **Email & Notification Engine:** Currently experimenting with provider-agnostic notification adapters (Cloudflare Email Routing, SMTP, Resend, SendGrid) so submissions can be delivered straight to your inbox without additional costs.

---

## Conclusion

You don't need a heavy SaaS subscription or vendor-locked infrastructure just to put a contact form on a personal static website. 

By combining the speed of static site generators like Hugo with the flexibility of **UnJS** and **Nitro**, we can build developer tooling that is cost-free, privacy-friendly, and portable across any cloud.

If you are building full-stack JavaScript utilities, APIs, or edge microservices in 2026, give **Nitro** and the **UnJS ecosystem** a spin—it fundamentally changes how you think about write-once, deploy-anywhere code.
