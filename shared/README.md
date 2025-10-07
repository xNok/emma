# Emma Shared Utilities

Shared TypeScript types, schemas, and utilities used across all Emma packages.

## Structure

```
shared/
├── schema/          # Form schema definitions and validators
│   ├── form.ts      # Form schema types
│   └── validators.ts
├── types/           # TypeScript type definitions
│   ├── index.ts     # Main type exports
│   ├── form.ts      # Form-related types
│   └── api.ts       # API types
└── utils/           # Shared utilities
    └── validation.ts
```

## Usage

Import shared types in any package:

```typescript
import type { FormSchema, FormField } from '@emma/shared/types';
import { validateFormSchema } from '@emma/shared/schema';
```

## Development

```bash
npm install
npm run build
```

## Type Definitions

See `/shared/types/index.ts` for all available types.
