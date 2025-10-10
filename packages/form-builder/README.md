# Emma Form Builder (TUI)

Terminal User Interface for creating and managing embeddable forms.

## Overview

The Form Builder is a command-line application that allows developers to:

- Create form schemas interactively
- Apply themes and styling
- Build form JavaScript bundles
- Deploy forms to Cloudflare R2
- Manage existing forms

## Installation

```bash
npm install -g @emma/form-builder
```

## Usage

```bash
# Initialize configuration
emma init

# Create a new form
emma create contact-form

# List all forms
emma list

# Build a form bundle
emma build contact-form-001

# Deploy locally (simulation)
emma deploy local contact-form-001

# Deploy to Cloudflare R2
emma deploy cloudflare contact-form-001 \
	--bucket emma-forms \
	--public-url https://forms.example.com

# Preview locally
emma preview contact-form-001
```

### Cloudflare Authentication

The deploy command uses Wrangler under the hood. Provide credentials via environment variables or flags:

- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID

You can also save defaults in your Emma config via `emma init` updates (coming soon) or by editing `~/.emma/config.json`:

```
{
	"cloudflare": {
		"bucket": "emma-forms",
		"publicUrl": "https://forms.example.com",
		"accountId": "xxxxxxxx"
	}
}
```

## Technology Stack

- TypeScript
- Ink (React for CLI) or Inquirer.js
- Commander.js
- Wrangler CLI (Cloudflare)
- Rollup/esbuild for bundling

## Development

```bash
npm install
npm run dev
```

## Documentation

See [/docs/02-technical-architecture.md](../../docs/02-technical-architecture.md) for detailed architecture.
