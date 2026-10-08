import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createDatabase } from './client.js'

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL is required')
}

const { db, sql } = createDatabase(url)
const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), '../drizzle')
await migrate(db, { migrationsFolder })
await sql.end()
console.log('Migrations applied')
