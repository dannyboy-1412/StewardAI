import {
  Controller,
  Inject,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { TranscriptionService } from './transcription.service.js'
import { memoryStorage } from 'multer'

@Controller('transcriptions')
export class TranscriptionsController {
  constructor(
    @Inject(TranscriptionService) private readonly transcription: TranscriptionService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async create(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('audio file is required')
    const text = await this.transcription.transcribe(file.buffer, file.mimetype)
    return { text }
  }
}
