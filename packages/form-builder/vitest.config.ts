import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    reporters: ['default', 'junit'],
    outputFile: {
      junit: './junit.xml',
    },
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@emma/shared': path.resolve(__dirname, '../../shared'),
    },
  },
});
