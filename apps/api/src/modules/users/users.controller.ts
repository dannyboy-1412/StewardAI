import { Controller, Get } from '@nestjs/common'
import { CurrentUser, type CurrentUserRecord } from '../../auth/current-user.js'

@Controller('users')
export class UsersController {
  @Get('me')
  me(@CurrentUser() user: CurrentUserRecord) {
    return user
  }
}
