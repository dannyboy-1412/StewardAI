import { Module } from '@nestjs/common'
import { CitationsController } from './citations.controller.js'

@Module({
  controllers: [CitationsController],
})
export class CitationsModule {}
