# Nix Development & Testing Environment

Emma includes a complete [Nix](https://nixos.org/) environment to provide a zero-config, reproducible development and testing setup across Linux and macOS.

## Included Tooling

The Nix shell automatically equips you with:

- **Node.js (v22)** & **Corepack / Yarn Berry**
- **Hugo Extended** (for compiling and serving the test website)
- **Cloudflare Wrangler CLI** (for managing Workers, D1 database, KV, and R2)
- **1Password CLI (`op`)** (for loading secrets via `source bin/load-secrets.sh`)
- **Actionlint & GitHub CLI (`gh`)** (for workflow checks and GitHub operations)
- **Git**

---

## Getting Started

### Option 1: Nix Flakes (Recommended)

If you have Flakes enabled:

```bash
# Enter the development environment
nix develop
```

### Option 2: Classic `nix-shell`

If you are using standard Nix without flakes:

```bash
nix-shell
```

### Option 3: Direnv (Automatic Shell Activation)

If you use [`direnv`](https://direnv.net/) (optionally with [`nix-direnv`](https://github.com/nix-community/nix-direnv) for fast flake evaluation):

```bash
# Allow the repository .envrc once
direnv allow
```

Whenever you `cd` into the project directory, all tooling, Node runtimes, Hugo, and environment variables are loaded automatically. If `nix-direnv` is not installed, `.envrc` automatically falls back to standard `use nix`.

---

## Daily Development Workflow

Once inside the Nix shell:

```bash
# 1. Load Cloudflare credentials (if using 1Password)
source bin/load-secrets.sh

# 2. Build the packages
yarn build

# 3. Run all tests
yarn test

# 4. Use the Emma CLI
yarn emma --help

# 5. Start the Hugo demo website
yarn dev:website
```
