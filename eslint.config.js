// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const boundaries = require('eslint-plugin-boundaries');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  // Architectural boundaries between core, shared and features (src/app/*.ts files
  // like app.config.ts stay unmatched/unknown and are left unchecked by design).
  {
    files: ['src/app/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.ts', '.js'],
        },
      },
      'boundaries/elements': [
        { type: 'core', pattern: 'src/app/core/**' },
        { type: 'shared', pattern: 'src/app/shared/**' },
        { type: 'features', pattern: 'src/app/features/(*)/**', capture: ['featureName'] },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'core' } },
              allow: { to: { element: { type: 'core' } } },
              message: 'core must be self-contained: it cannot import from shared or features.',
            },
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { type: 'shared' } } },
              message: 'shared must be self-contained: it cannot import from core or features.',
            },
            {
              from: { element: { type: 'features' } },
              allow: {
                to: [
                  { element: { types: { anyOf: ['core', 'shared'] } } },
                  {
                    element: {
                      type: 'features',
                      captured: { featureName: '{{from.featureName}}' },
                    },
                  },
                ],
              },
              message: 'features may only import core, shared, and files within the same feature.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
  eslintConfigPrettier,
]);
