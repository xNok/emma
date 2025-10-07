# Emma - Embeddable Forms for Hugo

**Status:** 🚧 In Development

Emma is a system for creating, deploying, and embedding forms into Hugo websites using Cloudflare's edge infrastructure.

1. **Create forms** using a Terminal UI (TUI)
2. **Deploy forms** to Cloudflare's global edge network
3. **Embed forms** in Hugo sites with a simple shortcode

**Example:**
```markdown
{{< embed-form "contact-form-001" >}}
```

That's it! The form loads from a CDN and submits to a serverless API.

## 📋 Current Status

✅ **Documentation Complete** - All design docs written  
✅ **Project Structure** - Monorepo set up  
✅ **Configuration** - TypeScript, ESLint, Prettier ready  
⏳ **Implementation** - Ready to start coding

## 🗂️ Project Structure

```
emma/
├── packages/
│   ├── form-builder/    → CLI tool for creating forms
│   ├── api-worker/      → Cloudflare Worker (handles submissions)
│   ├── form-renderer/   → Client-side JS (renders forms)
│   └── hugo-module/     → Hugo shortcode integration
├── shared/              → Shared TypeScript types
├── docs/                → All documentation
├── examples/            → Sample form configs
└── migrations/          → Database schemas
```

## 📚 Essential Reading

**Start here:**
1. [00-mvp-embeddable-forms.md](./docs/00-mvp-embeddable-forms.md) - Project vision
2. [02-technical-architecture.md](./docs/02-technical-architecture.md) - How it works
3. [FOUNDATION-SUMMARY.md](./docs/FOUNDATION-SUMMARY.md) - What's been done

**For specific areas:**
- Hugo integration: [features/hugo-shortcode.md](./docs/features/hugo-shortcode.md)
- Infrastructure: [infrastructure/cloudflare.md](./docs/infrastructure/cloudflare.md)

## 🛠️ Development Workflow

### 1. Understanding the Flow

```
Developer creates form
    ↓
TUI builds JS bundle
    ↓
Deploy to Cloudflare R2
    ↓
Hugo site embeds form
    ↓
Visitor fills & submits
    ↓
Data saved to D1 database
```

### 2. Documentation-Driven Development

**Before writing code:**
1. Read the latest numbered doc in `/docs`
2. Understand what's being built and why
3. If making changes, update docs first

**The rule:** Docs are the single source of truth.

### 3. Working on Packages

Each package is independent:

```bash
# Work on Form Builder
cd packages/form-builder
npm install
npm run dev

# Work on API Worker  
cd packages/api-worker
npm install
npx wrangler dev

# Work on Form Renderer
cd packages/form-renderer
npm install
npm run dev
```

## 🧪 Example: Creating Your First Form

Once implemented, this is what it will look like:

```bash
# 1. Create a form
$ emma create contact-form

? Form name: Contact Form
? Add field: name (text)
? Add field: email (email)  
? Add field: message (textarea)
? Theme: default
✓ Form created: contact-form-001

# 2. Deploy it
$ emma deploy contact-form-001

✓ Building bundle...
✓ Uploading to R2...
✓ Form deployed: https://forms.yourdomain.com/contact-form-001.js

# 3. Use in Hugo
{{< embed-form "contact-form-001" >}}
```

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run typecheck
```

## 📦 Package Dependencies

- **form-builder** depends on: `shared/types`, `shared/schema`
- **api-worker** depends on: `shared/types`
- **form-renderer** depends on: `shared/types`
- **hugo-module** - No dependencies (plain Hugo templates)

## 🤝 Getting Help

1. Check the docs in `/docs`
2. Look at example forms in `/examples`
3. Read package READMEs
4. Review the technical architecture

## ✅ Checklist: Before You Start Coding

- [ ] Read MVP document (00-mvp-embeddable-forms.md)
- [ ] Understand the architecture (02-technical-architecture.md)
- [ ] Review the package you'll work on
- [ ] Understand the data flow
- [ ] Know where to update docs if needed

## 🎨 Design Principles

1. **Simple** - Easy for Hugo users to integrate
2. **Fast** - Small bundle sizes, edge deployment
3. **Secure** - Spam protection, rate limiting, validation
4. **Flexible** - Themeable, customizable
5. **Reliable** - Edge computing, global availability
