import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'eslint/config'
import obsidianmd from 'eslint-plugin-obsidianmd'

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(
  {
    ignores: ['build/**', 'node_modules/**', 'main.js'],
  },
  ...obsidianmd.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir,
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },
)
