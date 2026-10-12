'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { ensureDoc, type JSONContent } from '@docai/document'
import { createEditorExtensions } from '@docai/document/extensions'

export function ReviewPreview({ doc }: { doc: JSONContent }) {
  const editor = useEditor(
    {
      immediatelyRender: false,
      editable: false,
      extensions: createEditorExtensions({ history: false, uniqueId: false }),
      content: ensureDoc(doc),
      editorProps: {
        attributes: { class: 'editor-surface editor-review' },
      },
    },
    [JSON.stringify(doc)],
  )

  return <EditorContent editor={editor} />
}
