# Quick Start Guide

Get up and running with Emma Forms in 5 minutes.

## Prerequisites

- Hugo site (0.112.0+)
- Node.js (18+) for development
- Cloudflare account (for deployment)

## Installation

### Option 1: Hugo Module (Recommended)

1. **Initialize Hugo Modules** (if not already done):
   ```bash
   cd your-hugo-site
   hugo mod init github.com/yourusername/your-site
   ```

2. **Add Emma Forms to your Hugo config** (`hugo.toml`):
   ```toml
   [module]
     [[module.imports]]
       path = "github.com/emma-forms/hugo-module"
   ```

3. **Download the module**:
   ```bash
   hugo mod get
   ```

### Option 2: Git Submodule

```bash
cd your-hugo-site
git submodule add https://github.com/emma-forms/hugo-module themes/emma-forms
```

Then add to your `hugo.toml`:
```toml
theme = ["emma-forms", "your-existing-theme"]
```

## Create Your First Form

1. **Create a form schema** in `data/forms/contact.yaml`:

```yaml
name: contact
title: Contact Us
description: Send us a message
settings:
  submitButtonText: Send Message
  successMessage: Thank you! We'll be in touch soon.
fields:
  - name: name
    type: text
    label: Your Name
    required: true
    
  - name: email
    type: email
    label: Email Address
    required: true
    validation:
      pattern: email
      
  - name: message
    type: textarea
    label: Message
    required: true
    attributes:
      rows: 5
```

2. **Embed the form** in any content file or template:

```markdown
---
title: Contact
---

## Get in Touch

{{< emma-form "contact" >}}
```

## Configure the API Endpoint

In your `hugo.toml`, set your Cloudflare Worker URL:

```toml
[params.emma]
  apiEndpoint = "https://your-worker.your-subdomain.workers.dev"
```

## Deploy the API Worker

1. **Clone the Emma repository**:
   ```bash
   git clone https://github.com/emma-forms/emma.git
   cd emma
   ```

2. **Install dependencies**:
   ```bash
   yarn install
   ```

3. **Configure Wrangler** in `packages/api-worker/wrangler.toml`:
   ```toml
   name = "emma-forms-api"
   main = "src/index.ts"
   compatibility_date = "2024-01-01"
   
   [[d1_databases]]
   binding = "DB"
   database_name = "emma-forms"
   database_id = "your-database-id"
   ```

4. **Create D1 database**:
   ```bash
   yarn wrangler d1 create emma-forms
   ```

5. **Run migrations**:
   ```bash
   yarn wrangler d1 migrations apply emma-forms --remote
   ```

6. **Deploy the worker**:
   ```bash
   cd packages/api-worker
   yarn deploy
   ```

## Test Your Form

1. **Start Hugo dev server**:
   ```bash
   hugo server
   ```

2. **Visit your contact page** (e.g., `http://localhost:1313/contact`)

3. **Fill out and submit the form**

4. **Check submissions in Cloudflare Dashboard**:
   - Go to Workers & Pages → D1
   - Select `emma-forms` database
   - Run: `SELECT * FROM submissions ORDER BY created_at DESC LIMIT 10`

## Next Steps

- **[Customize Styling](./themes.md)** - Match your site's design
- **[Add More Field Types](./field-types.md)** - Explore all 13 field types
- **[Configure Notifications](./notifications.md)** - Get email alerts
- **[Advanced Features](./hugo-integration.md#advanced-usage)** - Custom themes, validation

## Need Help?

- Check the **[Troubleshooting Guide](./troubleshooting.md)**
- Review **[API Reference](./api-reference.md)**
- See **[Example Forms](/examples)**

## Common Quick Wins

### Add Honeypot Protection
Already included! Invisible to users, effective against bots.

### Enable AJAX Submissions
Default behavior - no page reload required.

### Real-time Validation
Built-in for email, URL, tel, and custom patterns.

### Accessibility
ARIA labels, keyboard navigation, and screen reader support included.

---

**Time to first submission: ~5 minutes** ⚡

Ready to build more complex forms? Continue with the **[Complete Developer Guide](./README.md)**.
