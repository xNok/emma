# Emma - Embeddable Forms for Hugo

**Status:** 🚧 In Development

Emma is a system for creating, deploying, and embedding forms into Hugo websites using Cloudflare's edge infrastructure.

## 📋 Project Structure

```
emma/
├── packages/
│   ├── form-builder/      # TUI for creating forms
│   ├── api-worker/        # Cloudflare Worker API
│   ├── form-renderer/     # Client-side form library
│   └── hugo-module/       # Hugo integration
├── shared/                # Shared types and utilities
├── docs/                  # Documentation
├── examples/              # Example forms
└── website/              # Project website
```

## 📚 Documentation

All project documentation follows a documentation-driven development approach:

1. **[00-mvp-embeddable-forms.md](docs/00-mvp-embeddable-forms.md)** - MVP vision and requirements
2. **[01-project-foundation.md](docs/01-project-foundation.md)** - Project structure and setup
3. **[02-technical-architecture.md](docs/02-technical-architecture.md)** - Detailed technical design

### Feature Documentation

- **[Hugo Shortcode](docs/features/hugo-shortcode.md)** - Integration guide
- **[Cloudflare Infrastructure](docs/infrastructure/cloudflare.md)** - Infrastructure setup

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Cloudflare account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/emma.git
cd emma

# Install dependencies
npm install

# Build all packages
npm run build
```

### Form Builder TUI

```bash
# Install globally
npm install -g packages/form-builder

# Initialize configuration
emma init

# Create your first form
emma create contact-form
```

## 🏗️ Development

### Workspace Commands

```bash
# Run development mode for all packages
npm run dev

# Build all packages
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

### Package-Specific Development

```bash
# Form Builder
cd packages/form-builder
npm run dev

# API Worker
cd packages/api-worker
npx wrangler dev

# Form Renderer
cd packages/form-renderer
npm run dev
```

## 🎯 Features

- ✅ Interactive TUI for form creation
- ✅ Cloudflare edge deployment
- ✅ Hugo shortcode integration
- ✅ Client-side validation
- ✅ Spam protection (honeypot)
- ✅ Rate limiting
- ✅ Theme support
- ✅ SQLite database (D1)

## 🛠️ Technology Stack

- **TUI:** TypeScript, Ink/Inquirer.js, Commander.js
- **API:** Cloudflare Workers, D1 (SQLite)
- **Renderer:** TypeScript, Vanilla JS
- **Hugo:** Go templates
- **Infrastructure:** Cloudflare R2, Workers, D1

## 📖 Usage Example

### 1. Create a Form

```bash
emma create contact-form
```

### 2. Deploy to Cloudflare

```bash
emma deploy contact-form-001
```

### 3. Embed in Hugo

```markdown
{{< embed-form "contact-form-001" >}}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests for specific package
npm test --workspace=packages/form-builder

# Run tests in watch mode
npm test -- --watch
```

## 📝 Contributing

This project follows a documentation-driven development approach. Before contributing:

1. Read [.github/copilot-instructions.md](.github/copilot-instructions.md)
2. Review the latest numbered document in `/docs`
3. Update documentation before making code changes

## Cloud-Based Development

This repository is optimized for cloud-based development environments like Gitpod and GitHub Codespaces. These platforms provide a pre-configured environment with all the necessary dependencies, allowing you to start coding immediately.

### GitHub Codespaces

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=428059888)

### Gitpod

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/jpmorganchase/hugo-quickstart)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🔗 Links

- Documentation: `/docs`
- Examples: `/examples`
- Issues: GitHub Issues

---

**Current Status:** Documentation complete, beginning implementation phase.

**Next Steps:** 
1. Implement Form Builder TUI
2. Create Form Renderer library
3. Deploy API Worker
4. Build example forms