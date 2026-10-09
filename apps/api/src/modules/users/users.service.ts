import { Inject, Injectable } from '@nestjs/common'
import { sql } from 'drizzle-orm'
import { users } from '@docai/database'
import { DatabaseService } from '../../infrastructure/database/database.service.js'
import type { CurrentUserRecord } from '../../auth/current-user.js'

const ENSURE_USER_TTL_MS = 5 * 60 * 1000

type CachedUser = CurrentUserRecord & { cachedAt: number }

@Injectable()
export class UsersService {
  private readonly recent = new Map<string, CachedUser>()

  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async ensureUser(user: CurrentUserRecord): Promise<CurrentUserRecord> {
    const cached = this.recent.get(user.id)
    if (
      cached &&
      cached.email === user.email &&
      cached.name === user.name &&
      Date.now() - cached.cachedAt < ENSURE_USER_TTL_MS
    ) {
      return user
    }
    if (!this.database.db) {
      this.recent.set(user.id, { ...user, cachedAt: Date.now() })
      return user
    }
    await this.database.db
      .insert(users)
      .values({
        id: user.id,
        email: user.email,
        name: user.name,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email,
          name: user.name,
        },
        setWhere: sql`${users.email} is distinct from ${user.email} or ${users.name} is distinct from ${user.name}`,
      })
    this.recent.set(user.id, { ...user, cachedAt: Date.now() })
    return user
  }
}
