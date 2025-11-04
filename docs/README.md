# Emma Internal Documentation

This directory contains internal documentation for the Emma Forms project. This documentation is intended for developers and contributors working on the Emma codebase.

## Documentation Structure

### Architecture & Design (Root Level)

Numbered documents (00-06) represent the architectural evolution and key design decisions:

- **[00-mvp-embeddable-forms.md](./00-mvp-embeddable-forms.md)** - Project vision and MVP scope
- **[01-project-foundation.md](./01-project-foundation.md)** - Initial project setup and foundation
- **[02-technical-architecture.md](./02-technical-architecture.md)** - Overall technical architecture
- **[03-deployment-architecture.md](./03-deployment-architecture.md)** - Deployment strategy
- **[04-api-worker-architecture.md](./04-api-worker-architecture.md)** - API Worker design
- **[05-architectural-decisions.md](./05-architectural-decisions.md)** - Key architectural decisions and rationale
- **[06-provider-system-architecture.md](./06-provider-system-architecture.md)** - Provider system design _(Latest)_

**Start here**: Read the highest-numbered document first (currently 06), as it will link back to relevant previous documents.

### Developer Guide

Implementation guides and reference documentation for developers:

- **[developer-guide/README.md](./developer-guide/README.md)** - Developer guide index
- **[developer-guide/quick-start.md](./developer-guide/quick-start.md)** - Get started quickly
- **[developer-guide/cli-reference.md](./developer-guide/cli-reference.md)** - Complete CLI command reference
- **[developer-guide/api-reference.md](./developer-guide/api-reference.md)** - API documentation
- **[developer-guide/field-types.md](./developer-guide/field-types.md)** - Supported form field types
- Plus deployment guides, troubleshooting, and more

### Technical Specifications

Detailed specifications for key components:

- **[specs/bundle-specification.md](./specs/bundle-specification.md)** - Form bundle format
- **[specs/provider-specification.md](./specs/provider-specification.md)** - Provider interface specification

### Features

Feature-specific documentation:

- **[features/hugo-shortcode.md](./features/hugo-shortcode.md)** - Hugo shortcode implementation
- **[features/form-change-strategies.md](./features/form-change-strategies.md)** - Form versioning strategies
- **[features/export-format.md](./features/export-format.md)** - Data export formats
- **[features/submission-viewing-guide.md](./features/submission-viewing-guide.md)** - Viewing submissions

### Infrastructure

Infrastructure setup and configuration:

- **[infrastructure/cloudflare.md](./infrastructure/cloudflare.md)** - Cloudflare Workers, R2, and D1 setup

### Testing

Testing documentation and strategies:

- **[testing/README.md](./testing/README.md)** - Testing overview
- **[testing/01-automated-testing.md](./testing/01-automated-testing.md)** - Automated test setup
- **[testing/02-manual-testing.md](./testing/02-manual-testing.md)** - Manual testing procedures
- **[testing/03-uat.md](./testing/03-uat.md)** - User acceptance testing

### Agent Summaries

Historical task completion summaries:

- **[agents-summaries/](./agents-summaries/)** - Agent task summaries (recent work)
- **[agents-summaries/archive/](./agents-summaries/archive/)** - Archived older summaries

## User-Facing Documentation

**User documentation is located in `/website/content/docs/`** and includes:

- Getting started guides
- Hugo integration instructions
- CLI command reference (user-focused)
- Configuration guides

The website documentation is what end-users see when they visit the Emma documentation site.

## Documentation-Driven Development

This project follows a documentation-driven development approach:

1. **Before coding**: Understand requirements from documentation
2. **During development**: Update relevant docs as you work
3. **After completion**: Create new agent summary documenting your work

See [.github/copilot-instructions.md](../.github/copilot-instructions.md) for contributor workflow details.

## Quick Navigation

| I want to...                        | Go to...                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------- |
| Understand the project architecture | [06-provider-system-architecture.md](./06-provider-system-architecture.md) |
| Get started developing              | [developer-guide/quick-start.md](./developer-guide/quick-start.md)         |
| Learn about CLI commands            | [developer-guide/cli-reference.md](./developer-guide/cli-reference.md)     |
| Deploy to Cloudflare                | [infrastructure/cloudflare.md](./infrastructure/cloudflare.md)             |
| Run tests                           | [testing/README.md](./testing/README.md)                                   |
| See recent changes                  | [agents-summaries/](./agents-summaries/)                                   |
