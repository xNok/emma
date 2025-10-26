---
'@xnok/emma-form-builder': minor
---

Implement API worker deployment in `emma init` command

- Add automatic API worker deployment as part of `emma init` with Cloudflare Wrangler integration
- Create D1 database and run migrations automatically during initialization
- Add environment variable validation (CLOUDFLARE_API_TOKEN, R2 credentials)
- Bundle migrations in form-builder package for self-contained npm distribution
- Add api-worker as dependency for seamless deployment from npm package
- Provide interactive prompts with optional worker deployment
- Add comprehensive error handling and recovery instructions
- Update configuration schema to store database ID and worker URL
