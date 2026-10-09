import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  StreamableFile,
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
    @Query('documentId', new ParseUUIDPipe({ optional: true })) documentId?: string,
  ) {
    return this.documents.listFiles(user.id, documentId)
  }

  @Get(':id/content')
  @Header('Cache-Control', 'private, max-age=31536000, immutable')
  async content(
    @CurrentUser() user: CurrentUserRecord,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const record = await this.documents.getFile(user.id, id)
    const bytes = await this.storage.download(record.storagePath)
    const filename = record.filename.replace(/["\\\r\n]/g, '_')
    return new StreamableFile(bytes, {
      type: record.mimeType,
      disposition: `inline; filename="${filename}"`,
    })
  }

  @Get(':id')
  get(@CurrentUser() user: CurrentUserRecord, @Param('id', ParseUUIDPipe) id: string) {
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
    @Query('documentId', new ParseUUIDPipe({ optional: true })) documentId?: string,
  ) {
    if (!file) throw new BadRequestException('file is required')
    if (documentId) await this.documents.get(user.id, documentId)
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
