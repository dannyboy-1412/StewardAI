import { Module } from '@nestjs/common'
import { TranscriptionService } from './transcription.service.js'
import { TranscriptionsController } from './transcriptions.controller.js'

@Module({
  providers: [TranscriptionService],
  controllers: [TranscriptionsController],
  exports: [TranscriptionService],
})
export class TranscriptionModule {}
