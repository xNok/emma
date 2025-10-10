# Emma - Embeddable Forms for Hugo

**Status:** ✅ CLI Ready - Local Development Available

Emma is a system for creating, deploying, and embedding forms into Hugo websites. The CLI is now fully functional for local development and testing.

1. **Create forms** using the interactive CLI (`emma create`)
2. **Deploy forms** locally for development and testing
3. **Embed forms** in Hugo sites with a simple shortcode

**Quick Start:**

```bash
# Install and initialize
npm install -g @emma/form-builder
emma init

# Create your first form
emma create contact-form

# Deploy locally for testing
emma deploy contact-form-001

# Preview in browser
emma preview contact-form-001
```

**Hugo Integration:**

```markdown
{{< embed-form "contact-form-001" >}}
```

## 📋 Current Status

✅ **CLI Implementation** - Fully functional form builder CLI  
✅ **Local Development** - Complete local deployment simulation  
✅ **Form Builder** - Interactive form creation with 13+ field types  
✅ **Bundle Generation** - Self-contained JavaScript bundles  
✅ **Test Coverage** - Comprehensive test suite with 50+ tests  
⏳ **Production Deployment** - Cloudflare integration pending

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

## 📚 Documentation

### Quick Start

- **[Quick Start Guide](./docs/developer-guide/quick-start.md)** - Get running in 5 minutes
- **[Developer Guide](./docs/developer-guide/README.md)** - Complete development documentation

### Architecture & Design

- [00-mvp-embeddable-forms.md](./docs/00-mvp-embeddable-forms.md) - Project vision
- [02-technical-architecture.md](./docs/02-technical-architecture.md) - Technical architecture
- [FOUNDATION-SUMMARY.md](./docs/FOUNDATION-SUMMARY.md) - Implementation progress

### Specific Topics

- [Hugo Integration](./docs/features/hugo-shortcode.md) - Embedding forms in Hugo
- [Cloudflare Infrastructure](./docs/infrastructure/cloudflare.md) - Workers, D1, R2 setup
- [Field Types](./docs/developer-guide/field-types.md) - All 13 supported field types
- [API Reference](./docs/developer-guide/api-reference.md) - REST API documentation
- [Troubleshooting](./docs/developer-guide/troubleshooting.md) - Common issues & solutions

## 🛠️ Emma CLI Usage

### 1. Quick Start Workflow

```bash
# One-time setup
emma init

# Create a form interactively
emma create my-contact-form
# Follow prompts to add fields, validation, themes

# Build the form bundle
emma build my-contact-form-001

# Deploy to local development server
emma deploy my-contact-form-001

# Preview in browser
emma preview my-contact-form-001
```

### 2. Available Commands

- `emma init` - Initialize Emma configuration
- `emma create <name>` - Create new form interactively
- `emma list [--detailed]` - List all forms
- `emma build <form-id>` - Build form JavaScript bundle
- `emma deploy <form-id>` - Deploy to local development server
- `emma preview <form-id>` - Open form in browser
- `emma delete <form-id>` - Delete a form

### 3. Development Flow

```
CLI creates form schema (YAML)
    ↓
Build generates JS bundle
    ↓
Deploy starts local server
    ↓
Hugo site embeds form
    ↓
Visitor fills & submits
    ↓
Data logged locally
```

### 4. Field Types Supported

- **Text Inputs**: text, email, textarea, number, tel, url
- **Selection**: select dropdown, radio buttons, checkboxes
- **Date/Time**: date, time, datetime-local
- **Special**: hidden fields for tracking

### 5. Features Available

- ✅ Interactive form creation with validation
- ✅ 13+ field types with options and validation rules
- ✅ Theme system (default, minimal)
- ✅ Honeypot spam protection
- ✅ Local development server
- ✅ Form preview and testing
- ✅ Hugo shortcode integration ready

## 🧪 Development & Testing

### Working on Packages

```bash
# Install and build CLI
cd packages/form-builder
yarn install && yarn build

# Run tests
yarn test

# Install globally for development
npm link

# Work on other packages
cd ../form-renderer && yarn dev
cd ../api-worker && yarn wrangler dev
```

## 🧪 Example: Complete Workflow

**Real working example with the CLI:**

```bash
# 1. Initialize (one-time setup)
$ emma init
✓ Emma CLI initialized successfully!

# 2. Create a form interactively
$ emma create contact-form

? Form display name: Contact Form
? Select a theme: default
? Submit button text: Send Message
📋 Adding form fields...
? Add field 1: Text Input > Your Name (required)
? Add field 2: Email > Email Address (required)
? Add field 3: Textarea > Message (required)
? Add field 4: ✅ Done adding fields
? Enable spam protection (honeypot)? Yes
✓ Form created: contact-form-001

# 3. Build and deploy locally
$ emma build contact-form-001
✓ Form bundle built successfully

$ emma deploy contact-form-001
✓ Form deployed successfully
Form URL: http://localhost:3333/forms/contact-form-001
API Endpoint: http://localhost:3333/api/submit/contact-form-001

# 4. Preview and test
$ emma preview contact-form-001
🌐 Opening in browser...
# 4. Preview and test in browser
$ emma preview contact-form-001
🌐 Opening in browser...

# 5. Use in Hugo
{{< embed-form "contact-form-001" >}}
```

## 🔧 Development Commands

```bash
# Install dependencies
yarn install

# Build all packages
yarn build

# Run tests
yarn test

# Lint code
yarn lint

# Format code
yarn format

# Type check
yarn typecheck
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
