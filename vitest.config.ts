/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@lp/shared': path.resolve(__dirname, 'packages/shared/src'),
      '@lp/config': path.resolve(__dirname, 'packages/config/src'),
      '@lp/auth': path.resolve(__dirname, 'packages/auth/src'),
      '@lp/validation': path.resolve(__dirname, 'packages/validation/src'),
      '@lp/types': path.resolve(__dirname, 'packages/types/src'),
      '@lp/db': path.resolve(__dirname, 'packages/db/src'),
      '@lp/db/*': path.resolve(__dirname, 'packages/db/src/*'),
      '@lp/domains': path.resolve(__dirname, 'packages/domains/_services/src'),
      '@lp/domains/*': path.resolve(__dirname, 'packages/domains/_services/src/*'),
      '@lp/events': path.resolve(__dirname, 'packages/events/src'),
      '@lp/communication': path.resolve(__dirname, 'packages/communication/src'),
    },
  },
})
