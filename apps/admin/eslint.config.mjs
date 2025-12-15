import { defineConfig } from 'eslint/config';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default defineConfig([
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      'no-console': ['warn'],
      '@typescript-eslint/no-unused-vars': ['error'],
    },
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
]);
