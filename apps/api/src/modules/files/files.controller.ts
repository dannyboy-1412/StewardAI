import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { randomUUID } from 'node:crypto'
import { CurrentUser, type CurrentUserRecord } from '../../auth/current-user.js'
import { StorageService } from '../../infrastructure/storage/storage.service.js'
import { DocumentsService } from '../documents/documents.service.js'
import { extractText } from './extract-text.js'

@Controller('files')
export class FilesController {
  constructor(
    @Inject(StorageService) private readonly storage: StorageService,
    @Inject(DocumentsService) private readonly documents: DocumentsService,
  ) {}

  @Get()
  list(
    @CurrentUser() user: CurrentUserRecord,
    @Query('documentId') documentId?: string,
  ) {
    return this.documents.listFiles(user.id, documentId)
  }

  @Get(':id')
  get(@CurrentUser() user: CurrentUserRecord, @Param('id') id: string) {
    return this.documents.getFile(user.id, id)
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async upload(
    @CurrentUser() user: CurrentUserRecord,
    @UploadedFile() file?: Express.Multer.File,
    @Query('documentId') documentId?: string,
  ) {
    if (!file) throw new BadRequestException('file is required')
    const id = randomUUID()
    const storagePath = `${user.id}/${id}/${file.originalname}`
    await this.storage.upload(storagePath, file.buffer, file.mimetype)
    let extractedText: string | null = null
    let status: 'ready' | 'failed' = 'ready'
    try {
      extractedText = await extractText(file.buffer, file.mimetype, file.originalname)
    } catch {
      status = 'failed'
    }
    return this.documents.saveFile({
      id,
      userId: user.id,
      documentId: documentId ?? null,
      filename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storagePath,
      extractedText,
      status,
    })
  }
}
