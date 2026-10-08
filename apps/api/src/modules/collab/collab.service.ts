import { Inject, Injectable, Logger } from '@nestjs/common'
import { Hocuspocus } from '@hocuspocus/server'
import { WebSocketServer } from 'ws'
import type { IncomingMessage, Server as HttpServer } from 'node:http'
import type { Duplex } from 'node:stream'
import { DocumentsService } from '../documents/documents.service.js'
import { applyYDocState, encodeYDoc, jsonToYDoc, yDocToJson } from './ydoc.js'
import { resolveDevUser } from '../../auth/current-user.js'

@Injectable()
export class CollabService {
  private readonly logger = new Logger(CollabService.name)
  private hocuspocus: Hocuspocus | null = null

  constructor(@Inject(DocumentsService) private readonly documents: DocumentsService) {}

  attach(httpServer: HttpServer) {
    const origins = (process.env.WEB_ORIGINS ?? 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim())

    this.hocuspocus = new Hocuspocus({
      debounce: 2000,
      onLoadDocument: async ({ documentName, document }) => {
        const user = resolveDevUser()
        const record = await this.documents.get(user.id, documentName)
        if (record.ydocState) {
          applyYDocState(document, record.ydocState)
        } else {
          const seeded = jsonToYDoc(record.contentJson)
          applyYDocState(document, encodeYDoc(seeded))
        }
        return document
      },
      onStoreDocument: async ({ documentName, document }) => {
        const user = resolveDevUser()
        const json = yDocToJson(document)
        await this.documents.update(user.id, documentName, {
          contentJson: json,
          ydocState: encodeYDoc(document),
        })
      },
    })

    const wss = new WebSocketServer({ noServer: true })
    httpServer.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      const { pathname } = new URL(request.url ?? '', 'http://localhost')
      if (pathname !== '/collab') return
      const origin = request.headers.origin
      if (origin && origins.length > 0 && !origins.includes(origin)) {
        socket.destroy()
        return
      }
      wss.handleUpgrade(request, socket, head, (ws) => {
        this.hocuspocus?.handleConnection(ws, request)
      })
    })
    this.logger.log('Hocuspocus attached at /collab')
  }
}
