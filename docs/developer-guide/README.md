# Developer Guide

Welcome to the Emma Forms developer documentation. This guide is split into focused sections for easy navigation.

## Quick Links

### Getting Started

- **[Quick Start](./quick-start.md)** - Get up and running in 5 minutes
- **[Package Overview](./packages.md)** - Understanding the monorepo structure

### Core Concepts

- **[Form Schemas](./form-schemas.md)** - How to define forms
- **[Field Types](./field-types.md)** - All supported input types and options
- **[Validation](./validation.md)** - Validation rules and error handling

### API Reference

- **[API Endpoints](./api-reference.md)** - REST API documentation
- **[Database Schema](./database.md)** - D1 database structure

### Integration

- **[Hugo Integration](./hugo-integration.md)** - Embedding forms in Hugo sites
- **[Themes & Styling](./themes.md)** - Customizing form appearance

### Deployment

- **[Deployment Providers](./deployment-providers.md)** - Provider contract and Cloudflare R2
- **[Cloudflare Quick Start](./cloudflare-quickstart.md)** - Fast path to R2 setup and deploy
- **[Cloudflare Setup](./cloudflare-deployment.md)** - Deploying to Cloudflare
- **[Environment Configuration](./configuration.md)** - Environment variables and settings

### Development

- **[Local Development](./local-development.md)** - Running locally
- **[Building & Testing](./building-testing.md)** - Build and test workflows
- **[Troubleshooting](./troubleshooting.md)** - Common issues and solutions

## Project Structure

```
emma/
├── packages/
│   ├── form-builder/      # CLI tool for creating forms
│   ├── api-worker/        # Cloudflare Worker (handles submissions)
│   ├── form-renderer/     # Client-side JS (renders forms)
│   └── hugo-module/       # Hugo shortcode integration
├── shared/                # Shared TypeScript types
├── docs/                  # Documentation (you are here!)
├── examples/              # Sample form configs
└── migrations/            # Database schemas
```

## Contributing

Please read our [contributing guidelines](../../.github/copilot-instructions.md) before making changes. We follow a documentation-driven development approach.

## Need Help?

- Check the [Troubleshooting Guide](./troubleshooting.md)
- Review [Example Forms](../../examples/)
- Read the [Technical Architecture](../02-technical-architecture.md)
