import { Inject, Injectable, Logger } from '@nestjs/common'
import { Hocuspocus } from '@hocuspocus/server'
import { WebSocketServer } from 'ws'
import type { IncomingMessage, Server as HttpServer } from 'node:http'
import type { Duplex } from 'node:stream'
import { DocumentsService } from '../documents/documents.service.js'
import { UsersService } from '../users/users.service.js'
import { applyYDocState, encodeYDoc, jsonToYDoc, yDocToJson } from './ydoc.js'
import { verifySupabaseAccessToken } from '../../auth/supabase-jwt.js'
import type { CurrentUserRecord } from '../../auth/current-user.js'

type CollabContext = { user: CurrentUserRecord }

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

@Injectable()
export class CollabService {
  private readonly logger = new Logger(CollabService.name)
  private hocuspocus: Hocuspocus | null = null

  constructor(
    @Inject(DocumentsService) private readonly documents: DocumentsService,
    @Inject(UsersService) private readonly users: UsersService,
  ) {}

  attach(httpServer: HttpServer) {
    const origins = (process.env.WEB_ORIGINS ?? 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim())

    this.hocuspocus = new Hocuspocus({
      debounce: 2000,
      onAuthenticate: async ({ token, documentName }) => {
        if (!token) throw new Error('Unauthorized')
        if (!UUID_PATTERN.test(documentName)) throw new Error('Forbidden')
        let verified: CurrentUserRecord
        try {
          verified = await verifySupabaseAccessToken(token)
        } catch {
          throw new Error('Unauthorized')
        }
        const user = await this.users.ensureUser(verified)
        try {
          await this.documents.get(user.id, documentName)
        } catch {
          throw new Error('Forbidden')
        }
        return { user } satisfies CollabContext
      },
      onLoadDocument: async ({ documentName, document, context }) => {
        const user = (context as CollabContext).user
        const record = await this.documents.get(user.id, documentName)
        if (record.ydocState) {
          applyYDocState(document, record.ydocState)
        } else {
          const seeded = jsonToYDoc(record.contentJson)
          applyYDocState(document, encodeYDoc(seeded))
        }
        return document
      },
      onStoreDocument: async ({ documentName, document, context }) => {
        const user = (context as CollabContext).user
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
