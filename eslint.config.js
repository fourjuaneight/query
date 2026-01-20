import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConf from './prettier.config.js';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['src/**/*.ts'],
    plugins: {
      prettier: prettierPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      'id-length': [
        'error',
        {
          exceptions: ['_', 'a', 'b', 'c', 'i', 'x', 'y', 'z'],
        },
      ],
      'no-await-in-loop': 'off',
      'no-console': [
        'error',
        {
          allow: ['error', 'log'],
        },
      ],
      'no-case-declarations': 'off',
      'no-nested-ternary': 'off',
      'no-throw-literal': 'off',
      'prettier/prettier': ['error', prettierConf],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
);
