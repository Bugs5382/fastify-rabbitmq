import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        '__tests__/__utils__/**',
        'bin',
        'docs',
        'lib',
        'release.config.cjs'
      ]
    }
  }
})
