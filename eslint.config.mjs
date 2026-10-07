import path from 'node:path'
import { fileURLToPath } from 'node:url'
import css from '@eslint/css'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import obsidianmd from 'eslint-plugin-obsidianmd'

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url))

export default tseslint.config(
  {
    ignores: ['build/**', 'node_modules/**', 'main.js'],
  },
  // Obsidian community-plugin review rules (manifest, API usage, etc.). Its first entry has
  // no `files` and sets JavaScript rules that cannot parse a stylesheet, so it skips CSS
  ...obsidianmd.configs.recommended.map((config) => (
    config.files ? config : { ...config, ignores: ['**/*.css'] }
  )),
  // The community directory lints styles.css too, so lint it here with the same kind of rules
  {
    files: ['**/*.css'],
    language: 'css/css',
    plugins: { css },
    extends: [css.configs.recommended],
    rules: {
      'css/no-important': 'error',
      // Obsidian defines the --text-normal family of variables when the app runs, so the
      // linter cannot see them
      'css/no-invalid-properties': ['error', { allowUnknownVariables: true }],
      // Baseline describes the web in general. Obsidian ships its own engine and the
      // manifest sets the oldest app version, which is the measure for what is safe here
      'css/use-baseline': 'off',
    },
  },
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
