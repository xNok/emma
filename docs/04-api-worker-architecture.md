# API Worker Architecture

This document outlines the modular architecture for the `api-worker` package, designed to be flexible and extensible for different deployment environments.

## Core Principles

- **Modularity**: The core application logic is decoupled from the server runtime. This allows us to support multiple deployment targets (e.g., Cloudflare Workers, DigitalOcean Functions, Express.js) with minimal code duplication.
- **OpenAPI-Driven**: The API is defined by an `openapi.yaml` specification. We use `openapi-typescript` to generate TypeScript types directly from this specification, ensuring that our code is always in sync with our API documentation.
- **Lightweight Framework**: We use [Hono](https://hono.dev/), a small, fast, and flexible web framework, to handle routing and middleware. Its API is similar to Express, making it easy to learn and use.

## Architecture Overview

The `api-worker` is structured into the following key components:

- **`src/server.ts`**: This is the main entry point for the Hono application. It sets up middleware (CORS, logging) and defines the API routes. It is environment-agnostic and contains the core application logic.
- **`src/cloudflare-index.ts`**: This is the entry point for the Cloudflare Worker. It imports the Hono app from `server.ts` and exports it, allowing it to run on the Cloudflare edge.
- **`src/index.ts`**: This is the entry point for running the server in a standard Node.js environment, useful for local development and testing.
- **`src/handlers/`**: This directory contains the route handlers. Each handler is responsible for a specific API endpoint (e.g., `handleSubmit`).
- **`src/database.ts`**: This module abstracts all database interactions. The initial implementation uses Cloudflare D1, but it can be easily swapped out for other databases.
- **`src/types.ts`**: This file is auto-generated from `openapi.yaml` and contains all the TypeScript types for our API.
- **`openapi.yaml`**: The single source of truth for our API's design.

## Adding New Providers

To add a new deployment provider (e.g., DigitalOcean Functions), you would follow these steps:

1.  **Create a new entry point**: Create a file like `src/do-index.ts` that imports the Hono app from `server.ts` and adapts it to the DigitalOcean Functions runtime.
2.  **Abstract environment-specific logic**: If the new provider requires a different database or other services, you would abstract the existing logic in `database.ts` into a generic interface and create a new implementation for the new provider.
3.  **Update build scripts**: Add a new build script to `package.json` to build the new entry point.

This modular design ensures that Emma can be deployed to a variety of environments without requiring a major rewrite of the application logic.
