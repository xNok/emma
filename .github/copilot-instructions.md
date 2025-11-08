# Copilot & Contributor Instructions

This repository follows a documentation-driven development workflow and a Yarn v4 monorepo layout. Keep docs in sync with code and prefer small, verifiable changes.

## Quick mental model (big picture)

- Monorepo: packages live under `packages/`, shared utilities in `shared/`, and the example Hugo site in `website/`.
- Major components:
  - `@xnok/emma-api-worker` (Cloudflare Worker via Nitro/wrangler) — handles submissions. See `packages/api-worker/`.
  - `form-builder` (CLI) — build-time tool used by `yarn emma` and E2E test helpers.
  - `form-renderer` — client JS used by the Hugo module and website.
  - `hugo-module` / `website` — Hugo integration and example deployment.

Shared types, Zod validators, and helpers are in `shared/` (import as `@emma/shared`). If you change schemas, update consumers and run the full type/test suite.

## Core Workflow: Docs First

Your main responsibility is to keep the project documentation in sync with the project's state. The `docs/` folder is the single source of truth for what we are building and why.

### How to Get Started

Navigate to the `docs/` directory.

Find the highest-numbered markdown file (e.g., 01-some-design.md, 02-another-decision.md). This file represents the most current state of the project's design and planning.

Read the latest document thoroughly. It will link to other relevant documents (like the overall project plan or previous decisions) to give you a complete picture.

### Your Responsibility

- **Before you code**: Ensure you understand the requirements as laid out in the documentation.
  - **Always read**: the highest numbered `docs/XX-.md` before starting any task.
- **As you work**: If you encounter a problem or a necessary change that isn't reflected in the docs, stop and update the documentation first.
- **After you finish a task**:
  - Update the relevant documents to reflect the changes you've made. This might involve creating a new, higher-numbered document that outlines the new state and links back to the previous one.
  - Always create a new `docs/agents-summaries/XX-task.md` file to report your accomplishments.

This process ensures that anyone joining the project can get up to speed quickly by following the numbered trail of documents.

## Developer workflows & commands

- Use Node >=18 and Yarn v4 (project `package.json` pins `yarn@4.10.3`).
- Common scripts (run from repo root):
  - `yarn dev:core` — start all package dev servers (excludes api-worker & website when scripted)
  - `yarn dev:api` — run `nitro dev` for the API worker
  - `yarn dev:website` — run the example Hugo site dev server
  - `yarn build` — builds all packages (`workspaces foreach`)
  - `yarn test` — runs package tests (website excluded by default)
  - `yarn test:e2e*` — E2E flows run under `form-builder` / `website` (see root scripts)
  - `yarn lint`, `yarn format:check`, `yarn typecheck`

Notes: many commands use `yarn workspaces foreach`. Prefer the root scripts unless you need to scope work to a single package.

## Conventions you must follow

- Docs-first: update `docs/` and add an entry in `docs/agents-summaries/` for any substantive change. The highest-numbered doc is the current design.
- Changesets: include a changeset when making public API changes; release flow uses `changeset`.
- Tests & validation: run `yarn build && yarn test && yarn lint && yarn format:check && yarn typecheck` locally before opening PRs.
- Small PRs: prefer small, focused PRs that include tests and a doc update when behavior changes.

## Integration points & notes for runtime edits

- API Worker: built with Nitro. Cloudflare target artifacts are in `.output/` (e.g. `.output/nitro.json`). Use `nitro build --preset cloudflare` or `yarn workspace @xnok/emma-api-worker run build:cloudflare`.
- Wrangler: `packages/api-worker` includes `dev:cloudflare` that invokes `wrangler dev` for remote testing.
- Hugo: `hugo-module` exposes shortcodes that wire into `form-renderer`. Check `examples/` for sample YAML form configs.
- Providers: provider implementations and the provider spec live under `packages/` (e.g., `provider-cloudflare`). Built-in providers are exported from `shared` (see `shared/index.ts`).

## Minimal contract for AI/code agents

- Inputs: edits must preserve repo scripts and pass root validation commands.
- Outputs: update docs first, add/modify tests for behavior changes, and run the full root checks before finalizing.

## Key files to inspect when you start

- `package.json` (root) — workspace scripts & dev tooling
- `packages/api-worker/package.json` — Nitro/Wrangler build targets
- `shared/` — types, validators, utilities
- `docs/` — architecture & developer guide (start with highest-numbered doc)
- `examples/` — real configs used in tests

If anything above is unclear or you want more detail (e.g., CI steps, Nitro config, or Cloudflare deployment examples), tell me what to expand and I will iterate.
