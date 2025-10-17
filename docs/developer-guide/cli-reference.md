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

Initialize Emma configuration and deploy infrastructure to your chosen provider.

```bash
emma init [--override]
```

**Options:**

- `--override` - Reconfigure provider setup and restart entire initialization process

**What it Does:**

1. **Provider Selection**: Choose deployment provider (Cloudflare, custom, etc.)
2. **Environment Verification**: Check required environment variables are set
3. **Infrastructure Deployment**:
   - Creates R2 bucket for form storage
   - Deploys API Worker to handle submissions
   - Creates D1 database
   - Runs database migrations
   - Tests infrastructure health
4. **Configuration Save**: Stores non-sensitive config to `~/.emma/config.json`

**First-Time Setup:**

```bash
$ emma init
🚀 Initializing Emma Forms CLI...

? Select deployment provider: Cloudflare (Workers + R2 + D1)

Checking environment variables...
✓ CLOUDFLARE_API_TOKEN found
✓ R2_ACCESS_KEY_ID found
✓ R2_SECRET_ACCESS_KEY found

Deploying infrastructure...
→ Creating R2 bucket "emma-forms"... ✓
→ Deploying API worker to Cloudflare... ✓
→ Creating D1 database "emma-submissions"... ✓
→ Running database migrations... ✓
→ Testing API worker endpoint... ✓

✓ Infrastructure deployed successfully!

Configuration saved:
  Provider: cloudflare
  Forms directory: /home/user/.emma/forms
  Builds directory: /home/user/.emma/builds
  Default theme: default
  Local server: http://localhost:3333
```

**Reconfiguration:**

```bash
$ emma init --override
⚠️  This will reconfigure your Emma setup.
? Continue? Yes

? Select deployment provider: Cloudflare (Workers + R2 + D1)
...
✓ Configuration updated successfully!
```

**Required Environment Variables:**

For Cloudflare provider:

```bash
# R2 Storage Access
export R2_ACCESS_KEY_ID="your-access-key-id"
export R2_SECRET_ACCESS_KEY="your-secret-access-key"
export R2_ACCOUNT_ID="your-cloudflare-account-id"
export R2_BUCKET_NAME="emma-forms"
export R2_PUBLIC_URL="https://forms.example.com"

# API Worker Deployment
export CLOUDFLARE_API_TOKEN="your-api-token"
export CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"
```

See [Environment Setup Guide](./environment-setup.md) for detailed instructions.

**Important:** Emma CLI never stores credentials. All authentication uses environment variables only.

---

### `emma edit <form-id>`

Edit an existing form and create a new snapshot. Each edit creates an immutable snapshot with a timestamp.

```bash
emma edit <form-id>
```

**Arguments:**

- `form-id` - The form ID to edit

**What it Does:**

- Opens interactive editor for form fields
- Allows adding, removing, or modifying fields
- Creates new snapshot when saved
- Updates `currentSnapshot` pointer
- Preserves complete history

**Example:**

```bash
$ emma edit contact-form

📝 Editing form: Contact Form

Current fields:
  1. name (text) - Your Name
  2. email (email) - Email Address
  3. message (textarea) - Message

? What would you like to do?
  > Add new field
    Edit existing field
    Remove field
    Change settings
    Save and exit

? Add new field: Phone

? Field type: Phone
? Field label: Phone Number
? Field ID: phone
? Required field? No

📝 Changes summary:
  + Added field: phone (tel)

? Save changes and create new snapshot? Yes

✓ Form updated successfully!

New snapshot created:
  Timestamp: 1729089000
  Changes: Added phone number field
  Bundle: contact-form-1729089000.js

Next steps:
  $ emma build contact-form
  $ emma deploy contact-form
  $ emma history contact-form  # View complete history
```

**When to Edit vs. Create New Form:**

- **Edit (same form)**: Non-breaking changes like adding optional fields, updating labels, or styling
- **Create new (different form)**: Breaking changes like removing required fields or changing field types

See [Form History Guide](./form-history.md) for detailed guidance.

---

### `emma history <form-id>`

View the complete snapshot history for a form, including all changes over time.

```bash
emma history <form-id>
```

**Arguments:**

- `form-id` - The form ID to view history for

**Example:**

```bash
$ emma history contact-form

📋 Form History: Contact Form

Current snapshot: 1729089000 (2025-10-16 14:30:00)

Snapshots (newest first):

  1729089000 - 2025-10-16 14:30:00 ✓ Deployed
  Changes: Added phone number field
  Bundle: contact-form-1729089000.js
  Fields: name, email, phone, message

  1727780400 - 2025-10-01 10:00:00 ✓ Deployed
  Changes: Initial version
  Bundle: contact-form-1727780400.js
  Fields: name, email, message

Total snapshots: 2
Total submissions: 45 (15 on older snapshot, 30 on current)

To deploy a specific snapshot:
  $ emma deploy contact-form --snapshot 1727780400
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

Deploy a form either locally (simulation) or to Cloudflare R2. Supports deploying specific snapshots for rollback.

```bash
# Default behavior: emma deploy <form-id> -> local
emma deploy <form-id> [--snapshot <timestamp>]

# Explicit subcommands
emma deploy local <form-id> [--port <port>] [--host <host>]
emma deploy cloudflare <form-id> [--snapshot <timestamp>] [--bucket <name>] [--public-url <url>] [--overwrite]
```

**Arguments:**

- `form-id` - The form ID to deploy

**General Options:**

- `--snapshot <timestamp>` - Deploy a specific snapshot (for rollback or testing). If not specified, deploys current snapshot.

**Local Options:**

- `--port`, `-p` - Override default port
- `--host`, `-h` - Override default host

**Cloudflare Options:**

- `--bucket` - R2 bucket name (e.g., `emma-forms`)
- `--public-url` - Base public URL serving the bucket (e.g., `https://forms.example.com`)
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
# Deploy current snapshot locally
emma deploy local contact-form

# Deploy current snapshot to Cloudflare
emma deploy cloudflare contact-form \
  --bucket emma-forms \
  --public-url https://forms.example.com

# Deploy specific snapshot (rollback)
emma deploy cloudflare contact-form --snapshot 1727780400

# If you've previously run `emma init` and configured Cloudflare
emma deploy contact-form  # Uses saved config
```

**Snapshot Deployment:**

When deploying a specific snapshot, Emma will:

1. Build the form bundle from that snapshot's configuration
2. Upload the bundle to R2 with snapshot timestamp in filename
3. Update the form registry to point to this snapshot
4. Log the deployment for history tracking

This allows you to:

- **Rollback** to a previous version if issues arise
- **Test** historical snapshots before making them current
- **Deploy multiple versions** simultaneously for A/B testing

```bash
# Example: Rolling back to previous version
$ emma history contact-form
Current snapshot: 1729089000
Previous: 1727780400

$ emma deploy contact-form --snapshot 1727780400

✓ Deployed snapshot 1727780400 to R2
  Bundle: contact-form-1727780400.js
  URL: https://forms.example.com/contact-form-1727780400.js

⚠️  Note: Current snapshot is still 1729089000
   To make this the current snapshot, edit the form config.
```

If you've previously run `emma init` and configured Cloudflare, you can omit
`--bucket` and `--public-url`. The saved values from `~/.emma/config.json` will be used.

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

Forms are stored as YAML files in `~/.emma/forms/` with snapshot tracking:

```yaml
formId: contact-form
name: Contact Form
createdAt: 2025-10-01T10:00:00Z
lastModified: 2025-10-16T14:30:00Z
currentSnapshot: 1729089000
theme: default
apiEndpoint: http://localhost:3333/api/submit/contact-form

# Snapshot history
snapshots:
  - timestamp: 1727780400 # 2025-10-01 10:00:00
    deployed: true
    storageKey: contact-form-1727780400.js
    changes: Initial version

  - timestamp: 1729089000 # 2025-10-16 14:30:00
    deployed: true
    storageKey: contact-form-1729089000.js
    changes: Added phone number field

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

  - id: phone
    type: tel
    label: Phone Number
    required: false
    addedAt: 1729089000 # Tracks when field was added

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

**Snapshot-Based Versioning:**

Emma uses timestamp-based snapshots instead of semantic versioning (no more `version: 1.0.0`). Each edit creates a new immutable snapshot that can be independently deployed. This approach:

- Eliminates manual version number management
- Maintains complete form history
- Enables easy rollback to any previous state
- Allows deploying multiple versions simultaneously

For more details, see [Form History Guide](./form-history.md) and [05-architectural-decisions.md](../05-architectural-decisions.md#3-form-versioning-strategy).

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
