import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { createDatabase, type Database } from '@docai/database'
import { resolveDevUser } from '../../auth/current-user.js'
import { eq } from 'drizzle-orm'
import { users } from '@docai/database'
import type postgres from 'postgres'

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name)
  db: Database | null = null
  private sql: postgres.Sql | null = null

  get enabled(): boolean {
    return this.db !== null
  }

  async onModuleInit() {
    const url = process.env.DATABASE_URL
    if (!url) {
      this.logger.warn('DATABASE_URL missing — using in-memory store')
      return
    }
    const client = createDatabase(url)
    this.db = client.db
    this.sql = client.sql
    const user = resolveDevUser()
    const existing = await this.db.select().from(users).where(eq(users.id, user.id))
    if (existing.length === 0) {
      await this.db.insert(users).values({
        id: user.id,
        email: user.email,
        name: user.name,
      })
    }
    this.logger.log('Connected to Postgres')
  }

  async onModuleDestroy() {
    await this.sql?.end({ timeout: 5 })
  }
}
