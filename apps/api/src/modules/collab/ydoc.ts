import * as Y from 'yjs'
import { TiptapTransformer } from '@hocuspocus/transformer'
import { createEditorExtensions } from '@docai/document/extensions'
import type { JSONContent } from '@docai/document'

const FIELD = 'default'
const extensions = createEditorExtensions({ history: false, uniqueId: true })

export function jsonToYDoc(json: JSONContent): Y.Doc {
  return TiptapTransformer.toYdoc(json, FIELD, extensions)
}

export function yDocToJson(document: Y.Doc): JSONContent {
  const json = TiptapTransformer.fromYdoc(document, FIELD)
  if (json && typeof json === 'object' && 'default' in json) {
    return (json as { default: JSONContent }).default
  }
  return json as JSONContent
}

export function encodeYDoc(document: Y.Doc): Buffer {
  return Buffer.from(Y.encodeStateAsUpdate(document))
}

export function applyYDocState(document: Y.Doc, state: Buffer | Uint8Array | null) {
  if (!state) return
  Y.applyUpdate(document, state)
}
