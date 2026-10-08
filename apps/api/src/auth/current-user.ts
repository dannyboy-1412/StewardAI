import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import { DEV_USER_ID } from '@docai/shared'

export type CurrentUserRecord = {
  id: string
  email: string
  name: string
}

export function resolveDevUser(): CurrentUserRecord {
  return {
    id: process.env.DEV_USER_ID ?? DEV_USER_ID,
    email: 'dev@writee.local',
    name: 'Dev User',
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserRecord => {
    const request = ctx.switchToHttp().getRequest<{ user?: CurrentUserRecord }>()
    return request.user ?? resolveDevUser()
  },
)
