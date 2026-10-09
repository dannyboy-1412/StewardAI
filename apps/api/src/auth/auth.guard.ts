import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from './public.js'
import { getBearerToken, verifySupabaseAccessToken } from './supabase-jwt.js'
import type { CurrentUserRecord } from './current-user.js'
import { UsersService } from '../modules/users/users.service.js'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(UsersService) private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string }
      user?: CurrentUserRecord
    }>()
    const token = getBearerToken(request.headers.authorization)
    if (!token) throw new UnauthorizedException()

    let user: CurrentUserRecord
    try {
      user = await verifySupabaseAccessToken(token)
    } catch {
      throw new UnauthorizedException()
    }
    request.user = await this.users.ensureUser(user)
    return true
  }
}
