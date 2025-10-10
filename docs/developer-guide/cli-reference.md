# Emma CLI Reference

Complete command-line interface reference for the Emma Forms system.

## Installation

```bash
# Install globally
npm install -g @emma/form-builder

# Or from source
cd packages/form-builder
npm link
```

## Global Configuration

Emma stores configuration and forms in `~/.emma/`:

```
~/.emma/
├── config.json         # Global configuration
├── forms/              # Form schemas (YAML)
│   ├── contact-001.yaml
│   └── newsletter-002.yaml
└── builds/             # Built form bundles
    ├── contact-001/
    └── newsletter-002/
```

## Commands

### `emma init`

Initialize Emma configuration. Run this once after installation.

```bash
emma init
```

**Prompts:**

- Default theme for new forms
- Local server port for previews
- Local server host
- Optional: Configure deployment provider(s), e.g., Cloudflare R2

**Example:**

```bash
$ emma init
🚀 Initializing Emma Forms CLI...

? Default theme for new forms: default
? Local server port for previews: 3333
? Local server host: localhost
✓ Emma CLI initialized successfully!

Configuration:
  Forms directory: /home/user/.emma/forms
  Builds directory: /home/user/.emma/builds
  Default theme: default
  Local server: http://localhost:3333
  Cloudflare: configured (bucket: emma-forms, publicUrl: https://forms.example.com)
```

---

### `emma create [form-name]`

Create a new form interactively with guided prompts.

```bash
emma create [form-name]
```

**Arguments:**

- `form-name` (optional) - Base name for the form

**Interactive Flow:**

1. Form display name and theme selection
2. Submit button text and success message
3. Field creation loop with validation
4. Spam protection settings

**Field Types Available:**

- Text Input, Email, Textarea
- Number, Phone, URL
- Select Dropdown, Radio Buttons, Checkboxes
- Date, Time, Date & Time
- Hidden Field

**Example:**

```bash
$ emma create contact-form

📝 Creating a new form...

? Form display name: Contact Form
? Select a theme: default
? Submit button text: Send Message
? Success message: Thank you for your message!

📋 Adding form fields...
? Add field 1: Text Input
  ? Field label: Your Name
  ? Field ID: name
  ? Placeholder text (optional): Enter your full name
  ? Required field? Yes
  ? Add validation rules? Yes
    ? Minimum length (optional): 2
    ? Maximum length (optional): 100

? Add field 2: Email
  ? Field label: Email Address
  ? Field ID: email
  ? Required field? Yes

? Add field 3: Textarea
  ? Field label: Message
  ? Field ID: message
  ? Number of rows: 5
  ? Required field? Yes

? Add field 4: ✅ Done adding fields

? Enable spam protection (honeypot)? Yes

🎉 Form created successfully!

Form Details:
  ID: contact-form-001
  Name: Contact Form
  Theme: default
  Fields: 3
```

---

### `emma list [options]`

List all created forms.

```bash
emma list [--detailed]
```

**Options:**

- `--detailed`, `-d` - Show detailed information about each form

**Example:**

```bash
$ emma list --detailed

📋 Found 2 form(s):

📝 contact-form-001
   Name: Contact Form
   Theme: default
   Fields: 3
   Version: 1.0.0

📝 newsletter-signup-002
   Name: Newsletter Signup
   Theme: minimal
   Fields: 2
   Version: 1.0.0
```

---

### `emma build <form-id>`

Build a JavaScript bundle for the specified form.

```bash
emma build <form-id> [--watch]
```

**Arguments:**

- `form-id` - The form ID to build

**Options:**

- `--watch`, `-w` - Watch for changes and rebuild (not implemented)

**What it Creates:**

- `~/.emma/builds/<form-id>/form.js` - JavaScript bundle
- `~/.emma/builds/<form-id>/index.html` - Preview HTML
- `~/.emma/builds/<form-id>/themes/` - Theme CSS files

**Example:**

```bash
$ emma build contact-form-001

✓ Form bundle built successfully

Build results:
  Bundle: /home/user/.emma/builds/contact-form-001/form.js
  Size: 12847 bytes
  Output: /home/user/.emma/builds/contact-form-001

Next steps:
  $ emma deploy contact-form-001
  $ emma preview contact-form-001
```

---

### `emma deploy`

Deploy a form either locally (simulation) or to Cloudflare R2 using subcommands.

```bash
# Default behavior: emma deploy <form-id> -> local
emma deploy <form-id>

# Explicit subcommands
emma deploy local <form-id> [--port <port>] [--host <host>]
emma deploy cloudflare <form-id> --bucket <name> --public-url <url> [--overwrite]
```

**Arguments:**

- `form-id` - The form ID to deploy

**Local Options:**

- `--port`, `-p` - Override default port
- `--host`, `-h` - Override default host

**Cloudflare Options:**

- `--bucket` - R2 bucket name (e.g., `emma-forms`)
- `--public-url` - Base public URL serving the bucket (e.g., `https://forms.example.com`)
- `--method` - Upload mechanism: `s3` (recommended) or `wrangler` (fallback). Default: auto-detect.
- `--access-key-id`, `--secret-access-key` - R2 S3 credentials (or use env `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`)
- `--endpoint` - Custom S3 endpoint (defaults to `https://<accountId>.r2.cloudflarestorage.com`)
- `--account-id` - Cloudflare account ID (falls back to env `CLOUDFLARE_ACCOUNT_ID`)
- `--api-token` - Cloudflare API token (falls back to env `CLOUDFLARE_API_TOKEN`) [wrangler only]
- `--overwrite` - Overwrite existing objects in R2

**Cloudflare Auth:**

You can authenticate via either method:

- S3 (recommended):

  ```
  export R2_ACCESS_KEY_ID=...
  export R2_SECRET_ACCESS_KEY=...
  # Optional if not providing --account-id or --endpoint
  export R2_ENDPOINT=https://<accountId>.r2.cloudflarestorage.com
  ```

- Wrangler (fallback):
  ```
  export CLOUDFLARE_API_TOKEN=...
  export CLOUDFLARE_ACCOUNT_ID=...
  ```

**Examples:**

```bash
# Local simulation
emma deploy local contact-form-001

# Cloudflare R2
emma deploy cloudflare contact-form-001 \
  --bucket emma-forms \
  --public-url https://forms.example.com

If you've previously run `emma init` and configured Cloudflare, you can omit
`--bucket` and `--public-url`. The saved values from `~/.emma/config.json` will be used.
```

---

### `emma preview <form-id>`

Open form preview in browser.

```bash
emma preview <form-id> [--port <port>] [--host <host>] [--no-open]
```

**Arguments:**

- `form-id` - The form ID to preview

**Options:**

- `--port`, `-p` - Override default port
- `--host`, `-h` - Override default host
- `--no-open` - Don't open browser automatically

**Example:**

```bash
$ emma preview contact-form-001

📝 Form Preview

Name: Contact Form
Theme: default
Fields: 3

URLs:
  Form: http://localhost:3333/forms/contact-form-001
  API:  http://localhost:3333/api/submit/contact-form-001

🌐 Opening in browser...

Hugo Integration:
  {{< embed-form "contact-form-001" >}}
```

---

### `emma delete <form-id>`

Delete a form and its build artifacts.

```bash
emma delete <form-id> [--force]
```

**Arguments:**

- `form-id` - The form ID to delete

**Options:**

- `--force`, `-f` - Skip confirmation prompt

**Example:**

```bash
$ emma delete contact-form-001

? Delete form "contact-form-001" (Contact Form)? This cannot be undone. Yes

✓ Form "contact-form-001" deleted successfully.
```

## Local Development Server

When you run `emma deploy` or `emma preview`, a local Express.js server starts with these endpoints:

### Form Endpoints

- `GET /forms/<form-id>` - Form preview page
- `GET /forms/<form-id>/<form-id>.js` - JavaScript bundle
- `GET /forms/<form-id>/themes/<theme>.css` - Theme CSS

### API Endpoints

- `POST /api/submit/<form-id>` - Form submission
- `GET /api/info` - Server information

### Admin Endpoints

- `GET /` - Server dashboard with form listing

## Form Schema Format

Forms are stored as YAML files in `~/.emma/forms/`:

```yaml
formId: contact-form-001
name: Contact Form
version: 1.0.0
theme: default
apiEndpoint: http://localhost:3333/api/submit/contact-form-001

fields:
  - id: name
    type: text
    label: Your Name
    required: true
    validation:
      minLength: 2
      maxLength: 100

  - id: email
    type: email
    label: Email Address
    required: true

  - id: message
    type: textarea
    label: Message
    rows: 5
    required: true

settings:
  submitButtonText: Send Message
  successMessage: Thank you for your message!
  errorMessage: Please fix the errors and try again.
  honeypot:
    enabled: true
    fieldName: website
```

## Validation Rules

Each field can have validation rules:

```yaml
validation:
  required: true # Required field
  minLength: 2 # Minimum text length
  maxLength: 100 # Maximum text length
  min: 18 # Minimum number value
  max: 120 # Maximum number value
  pattern: '^[a-z]+$' # Regex pattern
```

## Hugo Integration

Once a form is deployed, embed it in Hugo:

```markdown
---
title: Contact Us
---

# Contact Us

Please fill out the form below:

{{< embed-form "contact-form-001" >}}
```

The shortcode will load the form JavaScript bundle and render the form in the page.

## Troubleshooting

### Common Issues

**Command not found: emma**

```bash
# If installed globally
npm install -g @emma/form-builder

# If using from source
cd packages/form-builder && npm link
```

**Port already in use**

```bash
# Use different port
emma deploy my-form --port 3334
```

**Form not found**

```bash
# List available forms
emma list

# Check form ID spelling
emma preview correct-form-id-001
```

**Bundle errors**

```bash
# Rebuild form
emma build my-form-001

# Check form schema
cat ~/.emma/forms/my-form-001.yaml
```

### Debug Mode

Set `DEBUG=emma:*` environment variable for verbose logging:

```bash
DEBUG=emma:* emma deploy my-form-001
```
