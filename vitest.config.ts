import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    alias: {
      // The `obsidian` runtime is provided by the app, not the npm package, so
      // tests resolve it to a lightweight mock.
      obsidian: fileURLToPath(new URL('./test/obsidian-mock.ts', import.meta.url)),
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
    },
  },
})
