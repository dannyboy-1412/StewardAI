import { API_URL } from './env'
import type { TemplateId } from '@docai/shared'

export type DocumentRecord = {
  id: string
  title: string
  projectId: string | null
  contentJson: unknown
  createdAt: string
  updatedAt: string
}

export type FileRecord = {
  id: string
  filename: string
  mimeType: string
  sizeBytes: number
  status: string
  documentId: string | null
}

export type UserRecord = { id: string; email: string; name: string }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  me: () => request<UserRecord>('/users/me'),
  listDocuments: () => request<DocumentRecord[]>('/documents'),
  getDocument: (id: string) => request<DocumentRecord>(`/documents/${id}`),
  createDocument: (body: { title?: string; templateId?: TemplateId }) =>
    request<DocumentRecord>('/documents', { method: 'POST', body: JSON.stringify(body) }),
  updateDocument: (id: string, body: { title?: string }) =>
    request<DocumentRecord>(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteDocument: (id: string) =>
    request<void>(`/documents/${id}`, { method: 'DELETE' }),
  listFiles: (documentId?: string) =>
    request<FileRecord[]>(`/files${documentId ? `?documentId=${documentId}` : ''}`),
  uploadFile: async (file: File, documentId?: string) => {
    const form = new FormData()
    form.append('file', file)
    const response = await fetch(
      `${API_URL}/files${documentId ? `?documentId=${documentId}` : ''}`,
      { method: 'POST', body: form },
    )
    if (!response.ok) throw new Error(await response.text())
    return response.json() as Promise<FileRecord>
  },
  transcribe: async (blob: Blob) => {
    const form = new FormData()
    form.append('audio', blob, 'audio.webm')
    const response = await fetch(`${API_URL}/transcriptions`, {
      method: 'POST',
      body: form,
    })
    if (!response.ok) throw new Error(await response.text())
    return response.json() as Promise<{ text: string }>
  },
  listAiRuns: (documentId: string) =>
    request<{ id: string; prompt: string; status: string; createdAt: string }[]>(
      `/documents/${documentId}/ai/runs`,
    ),
}
