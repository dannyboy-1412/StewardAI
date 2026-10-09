import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createDatabase } from './client.js'

function loadDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const here = dirname(fileURLToPath(import.meta.url))
  const candidates = [
    join(here, '../../../.env'),
    join(here, '../../../apps/api/.env'),
    join(process.cwd(), '.env'),
    join(process.cwd(), '../../.env'),
  ]

  for (const path of candidates) {
    if (!existsSync(path)) continue
    process.loadEnvFile(path)
    if (process.env.DATABASE_URL) {
      return process.env.DATABASE_URL
    }
  }

  throw new Error('DATABASE_URL is required')
}

const url = loadDatabaseUrl()

const { db, sql } = createDatabase(url)
const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), '../drizzle')
await migrate(db, { migrationsFolder })
await sql.end()
console.log('Migrations applied')
