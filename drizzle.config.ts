import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './packages/db/src/schema/index.ts',
  out: './packages/db/src/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_API_KEY!,
  },
  verbose: true,
  strict: true,
})