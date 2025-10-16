# Project Foundation & Documentation Refinement

**Document Number:** 01  
**Date:** October 7, 2025  
**Status:** In Progress  
**Previous:** [00-mvp-embeddable-forms.md](./00-mvp-embeddable-forms.md)

## 1. Purpose

This document establishes the foundational project structure and refines the documentation framework for the Emma embeddable forms system. It serves as the bridge between the MVP planning phase and active development.

## 2. Documentation Structure

Following the documentation-driven development approach outlined in [.github/copilot-instructions.md](../.github/copilot-instructions.md), we maintain numbered documents that represent the project's evolution.

### Document Hierarchy

```
docs/
├── 00-mvp-embeddable-forms.md          # MVP vision and high-level tasks
├── 01-project-foundation.md             # This document: structure & refinements
├── 02-technical-architecture.md         # Detailed technical design (to be created)
├── features/                            # Feature-specific documentation
│   └── hugo-shortcode.md               # Hugo integration details
└── infrastructure/                      # Infrastructure documentation
    └── cloudflare.md                   # Cloudflare setup & configuration
```

## 3. Project Structure

The project will be organized into distinct modules:

```
emma/
├── packages/
│   ├── form-builder/                   # TUI application for form creation
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   ├── api-worker/                     # Cloudflare Worker for submissions
│   │   ├── src/
│   │   ├── wrangler.toml
│   │   └── README.md
│   ├── form-renderer/                  # JavaScript form rendering library
│   │   ├── src/
│   │   ├── themes/
│   │   ├── package.json
│   │   └── README.md
│   └── hugo-module/                    # Hugo integration module
│       ├── layouts/
│       ├── config.toml
│       └── README.md
├── shared/                             # Shared utilities and types
│   ├── schema/                         # Form schema definitions
│   └── types/                          # TypeScript types
├── docs/                               # Documentation
├── website/                            # Marketing/documentation website
└── examples/                           # Example implementations
```

## 4. Immediate Documentation Needs

Before laying down code, we need to complete these documentation files:

### 4.1 Technical Architecture (doc 02)

- Component interaction diagrams
- API contracts and data models
- Security considerations
- Error handling strategies
- Testing approach

### 4.2 Infrastructure Documentation (docs/infrastructure/cloudflare.md)

- Cloudflare R2 bucket configuration
- D1 database schema design
- Workers deployment strategy
- Domain and routing setup
- Environment variables and secrets management

### 4.3 Feature Documentation (docs/features/hugo-shortcode.md)

- Shortcode implementation specification
- Configuration options
- Usage examples
- Error handling
- Theme customization

## 5. Technology Stack

### Form Builder (TUI)

- **Runtime:** Node.js
- **Framework:** Ink (React for CLI) or Inquirer.js
- **Language:** TypeScript
- **CLI Framework:** Commander.js or Yargs

### API Worker

- **Platform:** Cloudflare Workers
- **Language:** TypeScript
- **Database:** Cloudflare D1 (SQLite)
- **Validation:** Zod or Joi

### Form Renderer

- **Language:** TypeScript
- **Build:** Rollup or esbuild
- **Styling:** CSS Modules or Tailwind CSS
- **Output:** Vanilla JS bundle (no framework dependency)

### Hugo Module

- **Template Engine:** Go templates
- **Integration:** Hugo shortcodes

## 6. Development Workflow

1. **Documentation First:** All features start with documentation
2. **Branch per Document:** Major changes get a new numbered document
3. **Test Before Deploy:** All components need test coverage
4. **Iterative Refinement:** Documents evolve as we learn

## 7. Next Steps

1. Complete technical architecture document (02)
2. Finalize infrastructure documentation
3. Detail Hugo shortcode specifications
4. Establish project directory structure
5. Initialize package configurations
6. Set up development tooling

## 8. Open Questions

- [x] ~~Should we use a monorepo tool (Turborepo, Nx) or simple npm workspaces?~~ **Resolved**: Using Yarn workspaces (simple, no additional tooling)
- [x] ~~What's our versioning strategy for the form schema?~~ **Resolved**: See [05-architectural-decisions.md](./05-architectural-decisions.md#3-form-schema-versioning-strategy)
- [x] ~~Do we need a migration path for form updates?~~ **Resolved**: See [05-architectural-decisions.md](./05-architectural-decisions.md#4-schema-migrations-and-field-updates)
- [x] ~~Should the TUI support local testing/preview of forms?~~ **Resolved**: Yes, implemented with local Express server
- [x] ~~What authentication method for the form builder API access?~~ **Resolved**: See [05-architectural-decisions.md](./05-architectural-decisions.md#2-authentication-strategy-for-cli-deployment)

## 9. Success Criteria

This foundation phase is complete when:

- [ ] All documentation sections are filled with actionable details
- [ ] Project structure is created with README files in each package
- [ ] Package.json files are configured with dependencies
- [ ] Development tooling (linting, formatting, testing) is set up
- [ ] First integration test path is documented

---

**Next Document:** [02-technical-architecture.md](./02-technical-architecture.md)
**See Also:** [05-architectural-decisions.md](./05-architectural-decisions.md) for resolved foundation questions
