import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@/components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, '../../src/lib'),
      '@/admin-lib': path.resolve(__dirname, './lib'),
      '@/shared': path.resolve(__dirname, '../../src/shared'),
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
  },
});
