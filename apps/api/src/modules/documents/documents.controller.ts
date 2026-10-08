import { Body, Controller, Delete, Get, Inject, Param, Patch, Post } from '@nestjs/common'
import {
  createDocumentBodySchema,
  createProjectBodySchema,
  updateDocumentBodySchema,
} from '@docai/shared'
import { CurrentUser, type CurrentUserRecord } from '../../auth/current-user.js'
import { DocumentsService } from './documents.service.js'

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

  @Get('documents/:id')
  get(@CurrentUser() user: CurrentUserRecord, @Param('id') id: string) {
    return this.documents.get(user.id, id)
  }

  @Patch('documents/:id')
  update(
    @CurrentUser() user: CurrentUserRecord,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const input = updateDocumentBodySchema.parse(body ?? {})
    return this.documents.update(user.id, id, input)
  }

  @Delete('documents/:id')
  remove(@CurrentUser() user: CurrentUserRecord, @Param('id') id: string) {
    return this.documents.remove(user.id, id)
  }

  @Get('documents/:id/versions')
  versions(@Param('id') id: string) {
    return this.documents.listVersions(id)
  }

  @Post('documents/:id/versions')
  async snapshot(
    @CurrentUser() user: CurrentUserRecord,
    @Param('id') id: string,
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
    @Param('id') id: string,
    @Param('versionId') versionId: string,
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
