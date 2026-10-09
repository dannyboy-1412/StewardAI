import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import {
  createDocumentBodySchema,
  createProjectBodySchema,
  updateDocumentBodySchema,
} from '@docai/shared'
import { CurrentUser, type CurrentUserRecord } from '../../auth/current-user.js'
import { DocumentsService } from './documents.service.js'
import { exportDocument, isExportFormat } from './export/export-document.js'
import { importDocumentFile } from './import-document.js'

@Controller()
export class DocumentsController {
  constructor(@Inject(DocumentsService) private readonly documents: DocumentsService) {}

  @Get('documents')
  list(@CurrentUser() user: CurrentUserRecord) {
    return this.documents.list(user.id)
  }

  @Post('documents')
  create(@CurrentUser() user: CurrentUserRecord, @Body() body: unknown) {
    const input = createDocumentBodySchema.parse(body ?? {})
    return this.documents.create(user.id, input)
  }

  @Post('documents/import')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async importFile(
    @CurrentUser() user: CurrentUserRecord,
    @UploadedFile() file?: { buffer: Buffer; originalname: string; mimetype: string },
  ) {
    if (!file) throw new BadRequestException('file is required')
    const imported = await importDocumentFile({
      buffer: file.buffer,
      filename: file.originalname,
      mimeType: file.mimetype,
    })
    return this.documents.create(user.id, imported)
  }

  @Get('documents/:id')
  get(@CurrentUser() user: CurrentUserRecord, @Param('id', ParseUUIDPipe) id: string) {
    return this.documents.get(user.id, id)
  }

  @Get('documents/:id/export')
  async export(
    @CurrentUser() user: CurrentUserRecord,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('format') format = 'docx',
  ) {
    if (!isExportFormat(format)) {
      throw new BadRequestException('Unsupported export format')
    }
    const doc = await this.documents.get(user.id, id)
    const file = await exportDocument({
      title: doc.title,
      contentJson: doc.contentJson,
      pageSettings: doc.pageSettings,
      format,
    })
    return new StreamableFile(file.body, {
      type: file.mime,
      disposition: `attachment; filename="${file.filename.replace(/["\\\r\n]/g, '_')}"`,
    })
  }

  @Post('documents/:id/copy')
  copy(@CurrentUser() user: CurrentUserRecord, @Param('id', ParseUUIDPipe) id: string) {
    return this.documents.copy(user.id, id)
  }

  @Patch('documents/:id')
  update(
    @CurrentUser() user: CurrentUserRecord,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const input = updateDocumentBodySchema.parse(body ?? {})
    return this.documents.update(user.id, id, input)
  }

  @Delete('documents/:id')
  remove(@CurrentUser() user: CurrentUserRecord, @Param('id', ParseUUIDPipe) id: string) {
    return this.documents.remove(user.id, id)
  }

  @Get('documents/:id/versions')
  versions(
    @CurrentUser() user: CurrentUserRecord,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.documents.listVersions(user.id, id)
  }

  @Post('documents/:id/versions')
  async snapshot(
    @CurrentUser() user: CurrentUserRecord,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { label?: string },
  ) {
    const doc = await this.documents.get(user.id, id)
    return this.documents.saveVersion(id, {
      contentJson: doc.contentJson,
      ydocState: doc.ydocState,
      source: 'manual',
      label: body?.label ?? 'Manual snapshot',
    })
  }

  @Post('documents/:id/versions/:versionId/restore')
  restore(
    @CurrentUser() user: CurrentUserRecord,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    return this.documents.restoreVersion(user.id, id, versionId)
  }

  @Get('projects')
  projects(@CurrentUser() user: CurrentUserRecord) {
    return this.documents.listProjects(user.id)
  }

  @Post('projects')
  createProject(@CurrentUser() user: CurrentUserRecord, @Body() body: unknown) {
    const input = createProjectBodySchema.parse(body)
    return this.documents.createProject(user.id, input.name)
  }
}
