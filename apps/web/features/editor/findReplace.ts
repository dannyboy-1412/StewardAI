import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Editor } from '@tiptap/react'

export const findReplaceKey = new PluginKey('findReplace')

export type FindMatch = { from: number; to: number }

export type FindReplaceMeta = {
  query: string
  caseSensitive: boolean
  activeIndex: number
}

export function collectMatches(
  doc: ProseMirrorNode,
  query: string,
  caseSensitive: boolean,
): FindMatch[] {
  if (!query) return []
  const matches: FindMatch[] = []
  const needle = caseSensitive ? query : query.toLowerCase()
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return
    const haystack = caseSensitive ? node.text : node.text.toLowerCase()
    let start = 0
    while (start <= haystack.length) {
      const index = haystack.indexOf(needle, start)
      if (index === -1) break
      matches.push({ from: pos + index, to: pos + index + query.length })
      start = index + Math.max(query.length, 1)
    }
  })
  return matches
}

function decorationsFor(doc: ProseMirrorNode, meta: FindReplaceMeta): DecorationSet {
  const matches = collectMatches(doc, meta.query, meta.caseSensitive)
  return DecorationSet.create(
    doc,
    matches.map((match, index) =>
      Decoration.inline(match.from, match.to, {
        class: index === meta.activeIndex ? 'find-match is-active' : 'find-match',
      }),
    ),
  )
}

export function setFindHighlights(
  editor: Editor,
  meta: FindReplaceMeta,
) {
  const { tr } = editor.state
  tr.setMeta(findReplaceKey, meta)
  editor.view.dispatch(tr)
}

export function replaceMatch(editor: Editor, match: FindMatch, replacement: string) {
  editor.chain().focus().insertContentAt({ from: match.from, to: match.to }, replacement).run()
}

export function replaceAllMatches(editor: Editor, matches: FindMatch[], replacement: string) {
  const sorted = [...matches].sort((a, b) => b.from - a.from)
  let chain = editor.chain().focus()
  for (const match of sorted) {
    chain = chain.insertContentAt({ from: match.from, to: match.to }, replacement)
  }
  chain.run()
}

export const FindReplace = Extension.create({
  name: 'findReplace',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: findReplaceKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const meta = tr.getMeta(findReplaceKey) as FindReplaceMeta | undefined
            if (meta) return decorationsFor(tr.doc, meta)
            return old.map(tr.mapping, tr.doc)
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)
          },
        },
      }),
    ]
  },
})
