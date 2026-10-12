import { API_URL } from './env'
import type { TemplateId } from '@docai/shared'
import {
  DEFAULT_PAGE_SETTINGS,
  mergePageSettings,
  type CitationStyle,
  type JSONContent,
  type PageSettings,
  type ProposedChange,
} from '@docai/document'
import { createClient } from '@/lib/supabase/client'

export type DocumentRecord = {
  id: string
  title: string
  projectId: string | null
  contentJson: unknown
  pageSettings?: PageSettings
  citationStyle?: CitationStyle
  createdAt: string
  updatedAt: string
}

export type AiRunRecord = {
  id: string
  prompt: string
  model: string
  status: string
  responseText?: string | null
  reviewStatus?: string | null
  changes?: unknown[]
  createdAt: string
}

export type CitationReportRecord = {
  style: CitationStyle
  headingBlockId: string | null
  entries: Array<{
    blockId: string
    text: string
    surname?: string
    year?: string
    doi?: string
    verification?: { status: string; doi?: string; url?: string }
  }>
  inText: Array<{ text: string; surname?: string; year?: string }>
  orphanCitations: Array<{ text: string; surname?: string; year?: string }>
  orphanReferences: Array<{ text: string; surname?: string }>
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

export type VersionRecord = {
  id: string
  documentId: string
  label: string | null
  source: 'manual' | 'ai' | 'autosave'
  createdAt: string
}

export async function getAccessToken(): Promise<string | null> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export async function authHeaders(): Promise<HeadersInit> {
  const token = await getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function redirectToLogin() {
  if (typeof window === 'undefined') return
  if (window.location.pathname === '/login') return
  const next = `${window.location.pathname}${window.location.search}`
  window.location.assign(`/login?next=${encodeURIComponent(next)}`)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(await authHeaders()),
      ...init?.headers,
    },
  })
  if (response.status === 401) {
    redirectToLogin()
    throw new Error('Unauthorized')
  }
  if (!response.ok) {
    throw new Error(await response.text())
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function documentPageSettings(record: DocumentRecord): PageSettings {
  return mergePageSettings(record.pageSettings ?? DEFAULT_PAGE_SETTINGS)
}

export const api = {
  me: () => request<UserRecord>('/users/me'),
  listDocuments: () => request<DocumentRecord[]>('/documents'),
  getDocument: (id: string) => request<DocumentRecord>(`/documents/${id}`),
  createDocument: (body: { title?: string; templateId?: TemplateId }) =>
    request<DocumentRecord>('/documents', { method: 'POST', body: JSON.stringify(body) }),
  updateDocument: (
    id: string,
    body: { title?: string; pageSettings?: PageSettings; citationStyle?: CitationStyle },
  ) =>
    request<DocumentRecord>(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteDocument: (id: string) =>
    request<void>(`/documents/${id}`, { method: 'DELETE' }),
  copyDocument: (id: string) =>
    request<DocumentRecord>(`/documents/${id}/copy`, { method: 'POST' }),
  importDocument: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const response = await fetch(`${API_URL}/documents/import`, {
      method: 'POST',
      body: form,
      headers: await authHeaders(),
    })
    if (response.status === 401) {
      redirectToLogin()
      throw new Error('Unauthorized')
    }
    if (!response.ok) throw new Error(await response.text())
    return response.json() as Promise<DocumentRecord>
  },
  exportDocument: async (id: string, format: 'docx' | 'md' | 'txt' | 'html') => {
    const response = await fetch(`${API_URL}/documents/${id}/export?format=${format}`, {
      headers: await authHeaders(),
    })
    if (response.status === 401) {
      redirectToLogin()
      throw new Error('Unauthorized')
    }
    if (!response.ok) throw new Error(await response.text())
    const blob = await response.blob()
    const disposition = response.headers.get('Content-Disposition') ?? ''
    const match = /filename="([^"]+)"/.exec(disposition)
    return { blob, filename: match?.[1] ?? `document.${format}` }
  },
  listVersions: (id: string) => request<VersionRecord[]>(`/documents/${id}/versions`),
  saveVersion: (id: string, label?: string) =>
    request<VersionRecord>(`/documents/${id}/versions`, {
      method: 'POST',
      body: JSON.stringify({ label }),
    }),
  restoreVersion: (id: string, versionId: string) =>
    request<DocumentRecord>(`/documents/${id}/versions/${versionId}/restore`, { method: 'POST' }),
  listFiles: (documentId?: string) =>
    request<FileRecord[]>(`/files${documentId ? `?documentId=${documentId}` : ''}`),
  uploadFile: async (file: File, documentId?: string) => {
    const form = new FormData()
    form.append('file', file)
    const response = await fetch(
      `${API_URL}/files${documentId ? `?documentId=${documentId}` : ''}`,
      { method: 'POST', body: form, headers: await authHeaders() },
    )
    if (response.status === 401) {
      redirectToLogin()
      throw new Error('Unauthorized')
    }
    if (!response.ok) throw new Error(await response.text())
    return response.json() as Promise<FileRecord>
  },
  transcribe: async (blob: Blob) => {
    const form = new FormData()
    form.append('audio', blob, 'audio.webm')
    const response = await fetch(`${API_URL}/transcriptions`, {
      method: 'POST',
      body: form,
      headers: await authHeaders(),
    })
    if (response.status === 401) {
      redirectToLogin()
      throw new Error('Unauthorized')
    }
    if (!response.ok) throw new Error(await response.text())
    return response.json() as Promise<{ text: string }>
  },
  listAiRuns: (documentId: string) =>
    request<AiRunRecord[]>(`/documents/${documentId}/ai/runs`),
  reviewAiRun: (
    documentId: string,
    runId: string,
    body: {
      outcome: 'accepted' | 'partial' | 'rejected'
      acceptedChangeIds: string[]
      changes: ProposedChange[]
    },
  ) =>
    request<AiRunRecord>(`/documents/${documentId}/ai/runs/${runId}/review`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  getAiLog: (documentId: string) =>
    request<{ contentJson: JSONContent }>(`/documents/${documentId}/ai/log`),
  exportAiLog: async (documentId: string, format: 'docx' | 'md') => {
    const response = await fetch(`${API_URL}/documents/${documentId}/ai/log/export?format=${format}`, {
      headers: await authHeaders(),
    })
    if (response.status === 401) {
      redirectToLogin()
      throw new Error('Unauthorized')
    }
    if (!response.ok) throw new Error(await response.text())
    const blob = await response.blob()
    const disposition = response.headers.get('Content-Disposition') ?? ''
    const match = /filename="([^"]+)"/.exec(disposition)
    return { blob, filename: match?.[1] ?? `ai-log.${format}` }
  },
  createAcknowledgement: (documentId: string, format: 'deakin' | 'usyd') =>
    request<{ statement: string }>(`/documents/${documentId}/ai/acknowledgement`, {
      method: 'POST',
      body: JSON.stringify({ format }),
    }),
  getCitationReport: (documentId: string) =>
    request<CitationReportRecord>(`/documents/${documentId}/citations`),
  setCitationStyle: (documentId: string, style: CitationStyle) =>
    request<DocumentRecord>(`/documents/${documentId}/citations/style`, {
      method: 'POST',
      body: JSON.stringify({ style }),
    }),
}

export type { JSONContent }
