import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    resolve: {
      alias: {
        '@lukitadproxd-netizen/core': path.resolve(__dirname, '../../core/dist/index.js')
      }
    }
  }
});