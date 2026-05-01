import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'vite.config.*', 'tailwind.config.*', 'postcss.config.*']),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // We use MSW + some pragmatic casts in mock layer.
      '@typescript-eslint/no-explicit-any': 'error',
      // React Compiler + RHF can trip this rule; we treat it as non-blocking.
      'react-hooks/incompatible-library': 'off',
    },
  },
  {
    files: ['src/mocks/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['src/components/ui/**/*.{ts,tsx}', 'src/routes/router.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
