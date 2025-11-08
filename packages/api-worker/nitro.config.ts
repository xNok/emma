import { defineNitroConfig } from 'nitropack/config';

export default defineNitroConfig({
  srcDir: 'src',
  preset: 'cloudflare-worker',

  // Compatibility date for Cloudflare Workers
  compatibilityDate: '2024-11-05',

  // Entry point for the H3 app
  entry: './cloudflare-index.ts',

  // Output directory - use dist/cloudflare for multi-provider support
  output: {
    dir: 'dist/cloudflare',
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
