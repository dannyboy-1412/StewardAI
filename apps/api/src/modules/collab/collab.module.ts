import { Module } from '@nestjs/common'
import { CollabService } from './collab.service.js'
import { UsersModule } from '../users/users.module.js'

@Module({
  imports: [UsersModule],
  providers: [CollabService],
  exports: [CollabService],
})
export class CollabModule {}
