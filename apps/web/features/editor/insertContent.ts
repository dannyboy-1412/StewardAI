import type { Editor } from '@tiptap/react'
import { api, authHeaders } from '@/lib/api'
import { API_URL } from '@/lib/env'

export async function resolveEditorSrc(src: string): Promise<string> {
  if (!src.startsWith(`${API_URL}/files/`)) return src
  const response = await fetch(src, { headers: await authHeaders() })
  if (!response.ok) throw new Error('Could not load file')
  return URL.createObjectURL(await response.blob())
}

export async function insertImageFile(editor: Editor, documentId: string) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    const uploaded = await api.uploadFile(file, documentId)
    const src = `${API_URL}/files/${uploaded.id}/content`
    editor.chain().focus().setImage({ src, alt: file.name }).run()
  }
  input.click()
}

export function insertEquation(editor: Editor) {
  const latex = window.prompt('LaTeX') ?? 'E = mc^2'
  editor.chain().focus().insertContent({ type: 'equation', attrs: { latex } }).run()
}
