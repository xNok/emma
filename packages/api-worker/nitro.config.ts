import { defineNitroConfig } from 'nitropack/config';

const preset = process.env.NITRO_PRESET || 'cloudflare-worker';

export default defineNitroConfig({
  srcDir: 'src',
  preset: preset,

  // Compatibility date for Cloudflare Workers
  compatibilityDate: '2024-11-05',

  // Use Nitro generic handlers rather than a hardcoded Cloudflare entry point
  handlers: [{ route: '/**', handler: '~/server.ts' }],

  // Dynamically set output directory based on preset for multi-provider support
  output: {
    dir: `dist/${preset}`,
  },

  // Cloudflare-specific configuration with wrangler settings
  cloudflare: {
    // Generate wrangler.json automatically
    wrangler: {
      // D1 database binding
      d1_databases: [
        {
          binding: 'DB',
          database_name: process.env.D1_DATABASE_NAME || 'emma-submissions',
          database_id: process.env.D1_DATABASE_ID || '',
        },
      ],
      // KV namespace binding
      kv_namespaces: [
        {
          binding: 'SCHEMA_CACHE',
          id: process.env.KV_NAMESPACE_ID || '',
        },
      ],
    },
  },

  // Development server configuration
  devServer: {
    watch: ['src/**/*'],
  },

  // TypeScript configuration
  typescript: {
    strict: true,
    tsConfig: {
      compilerOptions: {
        types: ['@cloudflare/workers-types'],
      },
    },
  },

  // Rollup options for build optimization
  rollupConfig: {
    output: {
      format: 'esm',
    },
  },

  // Hooks for custom build steps
  hooks: {},
});
