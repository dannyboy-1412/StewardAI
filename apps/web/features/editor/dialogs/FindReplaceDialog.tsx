'use client'

import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  collectMatches,
  replaceAllMatches,
  replaceMatch,
  setFindHighlights,
  type FindMatch,
} from '../findReplace'
import { DialogShell } from '../ui'

export function FindReplaceDialog({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [replacement, setReplacement] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [index, setIndex] = useState(0)
  const [matches, setMatches] = useState<FindMatch[]>([])

  function refresh(nextQuery = query, nextCase = caseSensitive, nextIndex = index) {
    const found = collectMatches(editor.state.doc, nextQuery, nextCase)
    setMatches(found)
    const activeIndex = found.length === 0 ? 0 : ((nextIndex % found.length) + found.length) % found.length
    setFindHighlights(editor, { query: nextQuery, caseSensitive: nextCase, activeIndex })
    return found
  }

  useEffect(() => {
    return () => setFindHighlights(editor, { query: '', caseSensitive: false, activeIndex: 0 })
  }, [editor])

  function goTo(nextIndex: number, found = matches) {
    if (found.length === 0) return
    const activeIndex = ((nextIndex % found.length) + found.length) % found.length
    setIndex(activeIndex)
    setFindHighlights(editor, { query, caseSensitive, activeIndex })
    const match = found[activeIndex]
    if (match) editor.commands.setTextSelection({ from: match.from, to: match.to })
  }

  return (
    <DialogShell title="Find and replace" onClose={onClose}>
      <input
        value={query}
        onChange={(event) => {
          const next = event.target.value
          setQuery(next)
          setIndex(0)
          refresh(next, caseSensitive, 0)
        }}
        placeholder="Find"
        className="mb-2 h-9 w-full rounded-md border border-line px-2 text-sm"
        autoFocus
      />
      <input
        value={replacement}
        onChange={(event) => setReplacement(event.target.value)}
        placeholder="Replace with"
        className="mb-2 h-9 w-full rounded-md border border-line px-2 text-sm"
      />
      <label className="mb-3 flex items-center gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={caseSensitive}
          onChange={(event) => {
            setCaseSensitive(event.target.checked)
            refresh(query, event.target.checked, 0)
          }}
        />
        Match case
      </label>
      <p className="mb-3 text-xs text-muted">
        {matches.length === 0 ? 'No matches' : `${index + 1} of ${matches.length}`}
      </p>
      <div className="flex justify-end gap-2">
        <button type="button" className="rounded-md px-3 py-1.5 text-sm hover:bg-mist" onClick={() => goTo(index + 1)}>
          Next
        </button>
        <button
          type="button"
          className="rounded-md px-3 py-1.5 text-sm hover:bg-mist"
          onClick={() => {
            const match = matches[index]
            if (!match) return
            replaceMatch(editor, match, replacement)
            const found = refresh(query, caseSensitive, index)
            if (found.length > 0) goTo(Math.min(index, found.length - 1), found)
          }}
        >
          Replace
        </button>
        <button
          type="button"
          className="rounded-md bg-forest px-3 py-1.5 text-sm text-white"
          onClick={() => {
            replaceAllMatches(editor, matches, replacement)
            refresh(query, caseSensitive, 0)
          }}
        >
          Replace all
        </button>
      </div>
    </DialogShell>
  )
}
