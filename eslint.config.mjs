import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import obsidianmd from 'eslint-plugin-obsidianmd'

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url))

export default tseslint.config(
  {
    ignores: ['build/**', 'node_modules/**', 'main.js', 'media-gallery/**'],
  },
  // Obsidian community-plugin review rules (manifest, API usage, etc.).
  ...obsidianmd.configs.recommended,
  // Type-aware, strict linting for the plugin source. Placed last so its rule
  // overrides win over the shared presets above.
  {
    files: ['src/**/*.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir,
      },
    },
    rules: {
      // Obsidian plugins run against browser + Electron globals that ESLint's
      // core rule does not know about; TypeScript already checks these.
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      // Interpolating numbers into CSS/attribute strings is intentional here.
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // No-op arrow callbacks (e.g. `.catch(() => {})`) and reassigned
      // placeholders are used deliberately.
      '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions'] }],
      // `||` is used intentionally for falsy (empty-string) fallbacks, and a few
      // defensive guards double as type narrowing; these stylistic rules fight
      // that without catching real bugs.
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/prefer-for-of': 'off',
    },
  },
)
