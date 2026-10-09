import { UnauthorizedException, createParamDecorator, type ExecutionContext } from '@nestjs/common'

export type CurrentUserRecord = {
  id: string
  email: string
  name: string
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserRecord => {
    const request = ctx.switchToHttp().getRequest<{ user?: CurrentUserRecord }>()
    if (!request.user) {
      throw new UnauthorizedException()
    }
    return request.user
  },
)
