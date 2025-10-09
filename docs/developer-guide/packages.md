# Package Overview

Emma is organized as a monorepo with multiple packages that work together.

## Package Structure

### @emma/shared

**Location:** `/shared`

Core types and utilities used across all packages.

**Key Exports:**

```typescript
// Types
import type {
  FormSchema,
  FormField,
  FieldType,
  ValidationRules,
  SubmissionData,
  SubmissionResponse,
} from '@emma/shared/types';

// Validators
import {
  validateFormSchema,
  validateSubmissionData,
} from '@emma/shared/schema';

// Utilities
import {
  generateFormId,
  generateSubmissionId,
  sanitizeInput,
  isValidEmail,
} from '@emma/shared/utils';
```

**Purpose:**

- Shared TypeScript type definitions
- Form schema validation
- Submission data validation
- Helper utilities
- ID generation

---

### @emma/form-renderer

**Location:** `/packages/form-renderer`

Client-side JavaScript library that renders forms and handles submissions.

**Usage:**

```typescript
import { FormRenderer } from '@emma/form-renderer';

const renderer = new FormRenderer({
  formId: 'contact-form-001',
  containerId: 'form-container',
  schema: formSchema,
  theme: 'default',
  onSuccess: (response) => {
    console.log('Form submitted!', response);
  },
});

renderer.render();
```

**Features:**

- Renders all field types dynamically
- Client-side validation
- AJAX form submission
- Real-time error feedback
- Honeypot spam protection
- ARIA accessibility
- Theme support

**Build Output:**

- `dist/emma-forms.js` - IIFE bundle
- `dist/emma-forms.min.js` - Minified IIFE
- `dist/emma-forms.esm.js` - ES Module
- Target: < 15KB gzipped

---

### @emma/api-worker

**Location:** `/packages/api-worker`

Cloudflare Worker that handles form submissions and stores data in D1.

**Endpoints:**

```
POST /submit/:formId    # Submit form data
GET  /health            # Health check
```

**Features:**

- Form submission handling
- Server-side validation
- Honeypot spam detection
- Rate limiting
- D1 database integration
- CORS support
- Multiple environments

**Deployment:**

```bash
cd packages/api-worker
wrangler deploy
```

---

### @emma/form-builder

**Location:** `/packages/form-builder`

**Status:** 🚧 Not yet implemented

Terminal User Interface (TUI) for creating and managing forms.

**Planned Commands:**

```bash
emma init              # Initialize configuration
emma create <name>     # Create new form interactively
emma build <form-id>   # Build form JS bundle
emma deploy <form-id>  # Deploy to Cloudflare
emma list              # List all forms
emma preview <id>      # Local preview
emma delete <form-id>  # Delete a form
```

**Features (Planned):**

- Interactive form creation
- YAML schema generation
- Build pipeline
- Cloudflare deployment
- R2 upload
- D1 registration
- Local preview server

---

### @emma/hugo-module

**Location:** `/packages/hugo-module`

Hugo module providing a shortcode for embedding forms.

**Usage:**

```markdown
{{< embed-form "contact-form-001" >}}
```

**Configuration:**

```toml
# hugo.toml
[params.emma]
  cdnUrl = "https://forms.yourdomain.com"
  defaultClass = "emma-form"
  showLoadingIndicator = true
```

**Features:**

- Simple one-line embedding
- Loading indicators
- NoScript fallback
- Error handling
- Customizable CSS classes

---

## Package Dependencies

```
form-builder
  └─ shared (types, schema, utils)
  └─ form-renderer (for bundling)

api-worker
  └─ shared (types, validators)

form-renderer
  └─ shared (types, validators)

hugo-module
  └─ (no dependencies - pure Hugo templates)
```

## Development Workflow

### Install Dependencies

```bash
yarn install
```

### Build All Packages

```bash
yarn build
```

### Build Individual Package

```bash
cd packages/form-renderer
yarn build
```

### Run Tests

```bash
yarn test
```

### Type Check

```bash
yarn typecheck
```

## Next Steps

- Learn about [Form Schemas](./form-schemas.md)
- Understand [Field Types](./field-types.md)
- Read about [Hugo Integration](./hugo-integration.md)
