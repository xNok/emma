import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.config.ts', '**/*.test.ts'],
    },
  },
  resolve: {
    alias: {
      '@xnok/shared/types': path.resolve(
        __dirname,
        '../../shared/dist/types/index.js'
      ),
      '@xnok/shared/schema': path.resolve(
        __dirname,
        '../../shared/dist/schema/validators.js'
      ),
      '@xnok/shared/utils': path.resolve(
        __dirname,
        '../../shared/dist/utils/helpers.js'
      ),
      '@xnok/shared': path.resolve(__dirname, '../../shared/dist/index.js'),
    },
  },
});
