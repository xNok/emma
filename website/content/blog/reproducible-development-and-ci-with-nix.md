---
title: 'Zero-Friction, Hermetic Development: Migrating Emma to Nix and Direnv'
date: 2026-09-20T21:50:00Z
draft: false
tags: ['nix', 'developer-experience', 'ci', 'cloudflare', 'playwright']
---

Building modern web infrastructure often requires balancing a diverse set of languages, runtimes, command-line interfaces, and operating system libraries.

At **Emma**, our mission is to make embeddable forms for static site generators effortless. But behind the scenes, developing and testing Emma involves an intricate monorepo toolchain:

- **Node.js 22 & Yarn Berry (v4)**: For TypeScript packages, Vite bundling, and the interactive CLI.
- **Hugo Extended**: For building and live-previewing embedded forms within documentation and static sites.
- **Cloudflare Wrangler CLI**: For deploying Nitro-powered API workers, D1 SQL databases, KV caches, and R2 assets.
- **1Password CLI (`op`)**: For injecting Cloudflare API tokens securely without storing secrets on disk.
- **Playwright E2E**: For running browser automation tests across headless Chromium.
- **Actionlint & GitHub CLI (`gh`)**: For validating CI pipelines and reviewing pull requests.

Until recently, onboarding a developer or configuring a new test runner meant juggling manual installation steps, distribution-specific package managers, and ad-hoc shell scripts.

Today, we're excited to share how we migrated Emma to a **declarative, reproducible Nix Flake and Direnv environment**, achieving 100% environment parity between local machines and GitHub Actions CI.

---

## 🛑 The "Works on My Machine" Dilemma

As Emma grew, maintaining developer consistency across macOS (x86_64 and Apple Silicon) and Linux workstations became challenging:

1. **Version Drift**: Developers running differing minor versions of Node or Hugo would occasionally produce subtly different build artifacts or CSS theme bundles.
2. **Ad-Hoc Install Scripts**: Scripts like `bin/install_1password_cli` relied on Debian/Ubuntu `apt` repositories, leaving macOS and non-Debian developers to fend for themselves.
3. **The Playwright Shared Library Trap**: Running headless browsers in automated CI or container environments frequently failed with cryptic missing shared library errors (`libglib-2.0.so.0`, `libnss3.so`, `libasound.so.2`, etc.) unless `sudo apt-get install` commands were run on the host.

We needed an environment that was **hermetic, declarative, and instant**.

---

## ❄️ Enter Nix & Nix Flakes

[Nix](https://nixos.org/) solves environment isolation by treating package dependencies like pure functional values. Every dependency is pinned, immutable, and isolated in the `/nix/store`.

We introduced a modern `flake.nix` supporting multiple systems (`x86_64-linux`, `aarch64-linux`, `x86_64-darwin`, `aarch64-darwin`):

```nix
{
  description = "Emma - Embeddable Forms for Hugo development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true; # Required for _1password-cli
        };
      in
      {
        devShells.default = pkgs.mkShell {
          name = "emma-dev-shell";

          buildInputs = with pkgs; [
            nodejs_22
            corepack
            hugo
            wrangler
            _1password-cli
            actionlint
            gh
            git
            playwright-driver.browsers
          ];

          env = {
            PLAYWRIGHT_BROWSERS_PATH = "${pkgs.playwright-driver.browsers}";
            PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = "${pkgs.playwright-driver.browsers}/chromium-1243/chrome-linux64/chrome";
            PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "true";
          };

          shellHook = ''
            export COREPACK_ENABLE_STRICT=0
            export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
            export PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright-driver.browsers}"
            export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="${pkgs.playwright-driver.browsers}/chromium-1243/chrome-linux64/chrome"
            export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS="true"
          '';
        };
      }
    );
}
```

---

## 💡 Solving Monorepo Nuances in Nix

Adopting Nix in a production monorepo brought several interesting technical challenges:

### 1. Yarn Berry & Corepack Isolation

In Yarn Berry projects, shipping a global `yarn` package from the system can shadow the repository-pinned version (`packageManager: yarn@4.10.3`). By provisioning only `nodejs_22` and `corepack`—and enabling `COREPACK_ENABLE_DOWNLOAD_PROMPT=0`—Nix transparently delegates to the exact repository Yarn binary without interactive prompts or version mismatches.

### 2. Hermetic Playwright Browsers

Rather than downloading browser binaries at test time and relying on host package managers for dynamic libraries, we bundled `pkgs.playwright-driver.browsers`. Nix automatically patches and links all Chromium shared libraries (`glib`, `nss`, `cairo`, `x11`, `alsa`) inside the Nix store.

By wiring `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` into Playwright's configuration, our end-to-end tests run reliably on any Linux machine or CI runner without touching `apt-get`.

### 3. Zero-Click Onboarding with Direnv

Using `.envrc`, developers with `direnv` and `nix-direnv` get their full environment loaded the moment they `cd` into the repository:

```bash
direnv allow
```

---

## 🚀 Bringing Nix into GitHub Actions CI

Local environment reproducibility is only half the battle; CI must run the exact same tools.

We updated our `.github/workflows/lint-test.yaml` using `cachix/install-nix-action`. Instead of separate setup actions for Node, Yarn, and OS packages, our CI now evaluates the exact same Flake:

```yaml
steps:
  - name: Checkout code
    uses: actions/checkout@v7

  - name: Install Nix
    uses: cachix/install-nix-action@v27
    with:
      extra_nix_config: |
        access-tokens = github.com=${{ secrets.GITHUB_TOKEN }}

  - name: Check Nix Flake
    run: nix flake check

  - name: Build and Test in Nix
    run: |
      nix develop --command yarn install
      nix develop --command yarn build
      nix develop --command yarn lint
      nix develop --command yarn test
      nix develop --command yarn test:e2e:ci
```

---

## 🧹 Housekeeping: Retiring Outdated Scripts

With all dependencies declaratively defined in Nix:

- We **deleted outdated installer scripts** such as `bin/install_1password_cli`.
- We simplified container configurations in `.devcontainer/devcontainer.json`.
- Developers can start testing or contributing in seconds using a single command:

```bash
nix develop
```

---

## 🎯 Next Steps

Whether you're developing on Linux, macOS, or running tests in GitHub Actions, you get the exact same compilers, CLI tools, and test environments.

Check out our new [Nix Environment Developer Guide](/docs/developer-guide/nix-environment/) to get started!
