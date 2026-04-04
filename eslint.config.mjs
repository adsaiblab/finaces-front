import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import angularEslint from '@angular-eslint/eslint-plugin';
import angularTemplateEslint from '@angular-eslint/eslint-plugin-template';
import angularTemplateParser from '@angular-eslint/template-parser';

export default [
  // ── TypeScript files ──────────────────────────────────────
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            'playwright.config.ts',
            'vitest.config.ts',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      '@angular-eslint': angularEslint,
    },
    rules: {
      // Angular
      '@angular-eslint/component-class-suffix': 'error',
      '@angular-eslint/directive-class-suffix': 'error',
      '@angular-eslint/no-empty-lifecycle-method': 'warn',
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',

      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // ── Angular HTML templates ────────────────────────────────
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: angularTemplateParser,
    },
    plugins: {
      '@angular-eslint/template': angularTemplateEslint,
    },
    rules: {
      '@angular-eslint/template/no-negated-async': 'error',
      '@angular-eslint/template/eqeqeq': ['error', { allowNullOrUndefined: true }],
    },
  },

  // ── Ignore patterns ───────────────────────────────────────
  {
    ignores: ['dist/', 'node_modules/', '.angular/', 'src/test-setup.js'],
  },

  // ── Test & E2E overrides ──────────────────────────────────
  // Mocks in tests don't need the same strict typing as production code.
  {
    files: ['**/*.spec.ts', 'e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // ── E2E global-setup: intentional console logs for CI debugging ──
  {
    files: ['e2e/global-setup.ts', 'e2e/global-teardown.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];
