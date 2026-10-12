import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post } from '@nestjs/common'
import {
  detectCitations,
  type CitationStyle,
  type JSONContent,
} from '@docai/document'
import { CurrentUser, type CurrentUserRecord } from '../../auth/current-user.js'
import { DocumentsService } from '../documents/documents.service.js'
import { verifyReference } from './reference-verifier.js'

@Controller('documents/:id/citations')
export class CitationsController {
  constructor(@Inject(DocumentsService) private readonly documents: DocumentsService) {}

  @Get()
  async report(
    @CurrentUser() user: CurrentUserRecord,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const doc = await this.documents.get(user.id, id)
    const detected = detectCitations(doc.contentJson as JSONContent)
    const entries = await Promise.all(
      detected.entries.map(async (entry) => ({
        ...entry,
        verification: await verifyReference({
          title: entry.title ?? entry.text,
          authors: entry.surname,
          year: entry.year,
          url: entry.url,
          doi: entry.doi,
          text: entry.text,
        }),
      })),
    )
    return {
      style: doc.citationStyle,
      headingBlockId: detected.headingBlockId,
      entries,
      inText: detected.inText,
      orphanCitations: detected.orphanCitations,
      orphanReferences: detected.orphanReferences,
    }
  }

  @Post('style')
  async setStyle(
    @CurrentUser() user: CurrentUserRecord,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { style?: CitationStyle },
  ) {
    const style = body?.style
    if (!style) return this.documents.get(user.id, id)
    return this.documents.update(user.id, id, { citationStyle: style })
  }
}
