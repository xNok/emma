import { defineNitroConfig } from 'nitropack/config';

export default defineNitroConfig({
  srcDir: 'src',
  preset: 'cloudflare-worker',
  
  // Compatibility date for Cloudflare Workers
  compatibilityDate: '2025-11-05',
  
  // Entry point for the H3 app
  entry: './cloudflare-index.ts',
  
  // Cloudflare-specific configuration
  cloudflare: {
    // D1 database binding
    d1Databases: {
      DB: process.env.D1_DATABASE_ID || '',
    },
    // KV namespace binding
    kvNamespaces: {
      SCHEMA_CACHE: process.env.KV_NAMESPACE_ID || '',
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
