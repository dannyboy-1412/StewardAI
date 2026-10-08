import { DEV_USER_ID } from '@docai/shared'
import { eq } from 'drizzle-orm'
import { createDatabase } from './client.js'
import { users } from './schema.js'

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL is required')
}

const { db, sql } = createDatabase(url)
const existing = await db.select().from(users).where(eq(users.id, DEV_USER_ID))
if (existing.length === 0) {
  await db.insert(users).values({
    id: DEV_USER_ID,
    email: 'dev@writee.local',
    name: 'Dev User',
  })
  console.log('Seeded dev user')
} else {
  console.log('Dev user already exists')
}
await sql.end()
