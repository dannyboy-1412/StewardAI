import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

export type Database = PostgresJsDatabase<typeof schema>

export function createDatabase(url: string): { db: Database; sql: postgres.Sql } {
  const sql = postgres(url, { max: 10, prepare: false })
  const db = drizzle(sql, { schema })
  return { db, sql }
}
