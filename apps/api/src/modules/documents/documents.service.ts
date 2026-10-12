import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, desc, eq } from 'drizzle-orm'
import {
  aiRuns,
  documentVersions,
  documents,
  files,
  projects,
} from '@docai/database'
import {
  defaultTitle,
  DEFAULT_PAGE_SETTINGS,
  mergePageSettings,
  templateContent,
  type CitationStyle,
  type JSONContent,
  type PageSettings,
} from '@docai/document'
import type { TemplateId } from '@docai/shared'
import { DatabaseService } from '../../infrastructure/database/database.service.js'
import { randomUUID } from 'node:crypto'

export type DocumentRecord = {
  id: string
  userId: string
  projectId: string | null
  title: string
  contentJson: JSONContent
  ydocState: Buffer | null
  pageSettings: PageSettings
  citationStyle: CitationStyle
  createdAt: Date
  updatedAt: Date
}

export type AiRunReviewStatus = 'pending' | 'accepted' | 'partial' | 'rejected'

export type AiRunRecord = {
  id: string
  documentId: string
  userId: string
  prompt: string
  model: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  ops: unknown[]
  error: string | null
  responseText: string | null
  changes: unknown[]
  reviewStatus: AiRunReviewStatus | null
  createdAt: Date
  completedAt: Date | null
}

export type VersionRecord = {
  id: string
  documentId: string
  contentJson: JSONContent
  ydocState: Buffer | null
  label: string | null
  source: 'manual' | 'ai' | 'autosave'
  aiRunId: string | null
  createdAt: Date
}

type MemoryStore = {
  documents: Map<string, DocumentRecord>
  versions: Map<string, VersionRecord>
  files: Map<
    string,
    {
      id: string
      userId: string
      documentId: string | null
      filename: string
      mimeType: string
      sizeBytes: number
      storagePath: string
      extractedText: string | null
      status: 'uploading' | 'ready' | 'failed'
      createdAt: Date
    }
  >
  projects: Map<string, { id: string; userId: string; name: string; createdAt: Date; updatedAt: Date }>
  aiRuns: Map<string, AiRunRecord>
}

const memory: MemoryStore = {
  documents: new Map(),
  versions: new Map(),
  files: new Map(),
  projects: new Map(),
  aiRuns: new Map(),
}

@Injectable()
export class DocumentsService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async list(userId: string) {
    if (!this.database.db) {
      return [...memory.documents.values()]
        .filter((doc) => doc.userId === userId)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    }
    return this.database.db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.updatedAt))
  }

  async get(userId: string, id: string): Promise<DocumentRecord> {
    if (!this.database.db) {
      const doc = memory.documents.get(id)
      if (!doc || doc.userId !== userId) throw new NotFoundException('Document not found')
      return doc
    }
    const rows = await this.database.db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
    const doc = rows[0]
    if (!doc) throw new NotFoundException('Document not found')
    return {
      ...doc,
      ydocState: doc.ydocState ? Buffer.from(doc.ydocState) : null,
      pageSettings: mergePageSettings(doc.pageSettings),
      citationStyle: doc.citationStyle ?? 'apa7',
    }
  }

  async create(
    userId: string,
    input: {
      title?: string
      templateId?: string
      projectId?: string | null
      contentJson?: JSONContent
      pageSettings?: PageSettings
      citationStyle?: CitationStyle
    },
  ) {
    if (input.projectId) await this.getProject(userId, input.projectId)
    const templateId = (input.templateId ?? 'blank') as TemplateId
    const title = input.title ?? defaultTitle(templateId)
    const contentJson = input.contentJson ?? templateContent(templateId)
    const pageSettings = mergePageSettings(input.pageSettings ?? DEFAULT_PAGE_SETTINGS)
    const now = new Date()
    const record: DocumentRecord = {
      id: randomUUID(),
      userId,
      projectId: input.projectId ?? null,
      title,
      contentJson,
      ydocState: null,
      pageSettings,
      citationStyle: input.citationStyle ?? 'apa7',
      createdAt: now,
      updatedAt: now,
    }
    if (!this.database.db) {
      memory.documents.set(record.id, record)
      return record
    }
    const inserted = await this.database.db
      .insert(documents)
      .values({
        id: record.id,
        userId,
        projectId: record.projectId,
        title,
        contentJson,
        pageSettings,
        citationStyle: record.citationStyle,
      })
      .returning()
    return inserted[0]!
  }

  async update(
    userId: string,
    id: string,
    patch: {
      title?: string
      projectId?: string | null
      contentJson?: JSONContent
      ydocState?: Buffer | null
      pageSettings?: PageSettings
      citationStyle?: CitationStyle
    },
  ) {
    const existing = await this.get(userId, id)
    if (patch.projectId) await this.getProject(userId, patch.projectId)
    const next: DocumentRecord = {
      ...existing,
      title: patch.title ?? existing.title,
      projectId: patch.projectId === undefined ? existing.projectId : patch.projectId,
      contentJson: patch.contentJson ?? existing.contentJson,
      ydocState: patch.ydocState === undefined ? existing.ydocState : patch.ydocState,
      pageSettings: patch.pageSettings
        ? mergePageSettings(patch.pageSettings)
        : existing.pageSettings,
      citationStyle: patch.citationStyle ?? existing.citationStyle,
      updatedAt: new Date(),
    }
    if (!this.database.db) {
      memory.documents.set(id, next)
      return next
    }
    const updated = await this.database.db
      .update(documents)
      .set({
        title: next.title,
        projectId: next.projectId,
        contentJson: next.contentJson,
        ydocState: next.ydocState,
        pageSettings: next.pageSettings,
        citationStyle: next.citationStyle,
        updatedAt: next.updatedAt,
      })
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
      .returning()
    return updated[0]!
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id)
    if (!this.database.db) {
      memory.documents.delete(id)
      return
    }
    await this.database.db
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
  }

  async saveVersion(
    documentId: string,
    input: {
      contentJson: JSONContent
      ydocState?: Buffer | null
      source: 'manual' | 'ai' | 'autosave'
      label?: string
      aiRunId?: string
    },
  ) {
    const record: VersionRecord = {
      id: randomUUID(),
      documentId,
      contentJson: input.contentJson,
      ydocState: input.ydocState ?? null,
      label: input.label ?? null,
      source: input.source,
      aiRunId: input.aiRunId ?? null,
      createdAt: new Date(),
    }
    if (!this.database.db) {
      memory.versions.set(record.id, record)
      return record
    }
    const inserted = await this.database.db
      .insert(documentVersions)
      .values(record)
      .returning()
    return inserted[0]!
  }

  async listVersions(userId: string, documentId: string) {
    await this.get(userId, documentId)
    if (!this.database.db) {
      return [...memory.versions.values()]
        .filter((version) => version.documentId === documentId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }
    return this.database.db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, documentId))
      .orderBy(desc(documentVersions.createdAt))
  }

  async copy(userId: string, id: string) {
    const doc = await this.get(userId, id)
    return this.create(userId, {
      title: `${doc.title} (Copy)`,
      contentJson: doc.contentJson,
      pageSettings: doc.pageSettings,
      citationStyle: doc.citationStyle,
    })
  }

  async restoreVersion(userId: string, documentId: string, versionId: string) {
    const versions = await this.listVersions(userId, documentId)
    const version = versions.find((item) => item.id === versionId)
    if (!version) throw new NotFoundException('Version not found')
    return this.update(userId, documentId, {
      contentJson: version.contentJson as JSONContent,
      ydocState: version.ydocState ? Buffer.from(version.ydocState) : null,
    })
  }

  async getProject(userId: string, id: string) {
    if (!this.database.db) {
      const project = memory.projects.get(id)
      if (!project || project.userId !== userId) throw new NotFoundException('Project not found')
      return project
    }
    const rows = await this.database.db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    const project = rows[0]
    if (!project) throw new NotFoundException('Project not found')
    return project
  }

  async listProjects(userId: string) {
    if (!this.database.db) {
      return [...memory.projects.values()].filter((project) => project.userId === userId)
    }
    return this.database.db.select().from(projects).where(eq(projects.userId, userId))
  }

  async createProject(userId: string, name: string) {
    const record = {
      id: randomUUID(),
      userId,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    if (!this.database.db) {
      memory.projects.set(record.id, record)
      return record
    }
    const inserted = await this.database.db.insert(projects).values(record).returning()
    return inserted[0]!
  }

  memory() {
    return memory
  }

  async createAiRun(input: {
    documentId: string
    userId: string
    prompt: string
    model: string
    mode?: 'edit' | 'ask'
  }) {
    const record: AiRunRecord = {
      id: randomUUID(),
      documentId: input.documentId,
      userId: input.userId,
      prompt: input.prompt,
      model: input.model,
      status: 'running',
      ops: [],
      error: null,
      responseText: null,
      changes: [],
      reviewStatus: input.mode === 'ask' ? null : 'pending',
      createdAt: new Date(),
      completedAt: null,
    }
    if (!this.database.db) {
      memory.aiRuns.set(record.id, record)
      return record
    }
    const inserted = await this.database.db.insert(aiRuns).values(record).returning()
    return inserted[0]!
  }

  async finishAiRun(
    id: string,
    patch: {
      status: 'completed' | 'failed' | 'cancelled'
      ops?: unknown[]
      error?: string
      responseText?: string
      changes?: unknown[]
      reviewStatus?: AiRunReviewStatus | null
    },
  ) {
    if (!this.database.db) {
      const run = memory.aiRuns.get(id)
      if (!run) return
      memory.aiRuns.set(id, {
        ...run,
        status: patch.status,
        ops: patch.ops ?? run.ops,
        error: patch.error ?? run.error,
        responseText: patch.responseText ?? run.responseText,
        changes: patch.changes ?? run.changes,
        reviewStatus: patch.reviewStatus === undefined ? run.reviewStatus : patch.reviewStatus,
        completedAt: new Date(),
      })
      return
    }
    await this.database.db
      .update(aiRuns)
      .set({
        status: patch.status,
        ops: patch.ops,
        error: patch.error,
        responseText: patch.responseText,
        changes: patch.changes,
        reviewStatus: patch.reviewStatus,
        completedAt: new Date(),
      })
      .where(eq(aiRuns.id, id))
  }

  async getAiRun(userId: string, documentId: string, runId: string): Promise<AiRunRecord> {
    const runs = await this.listAiRuns(userId, documentId)
    const run = runs.find((item) => item.id === runId)
    if (!run) throw new NotFoundException('AI run not found')
    return run
  }

  async reviewAiRun(
    userId: string,
    documentId: string,
    runId: string,
    input: {
      outcome: Exclude<AiRunReviewStatus, 'pending'>
      acceptedChangeIds: string[]
      changes: unknown[]
    },
  ) {
    const run = await this.getAiRun(userId, documentId, runId)
    const next: AiRunRecord = {
      ...run,
      reviewStatus: input.outcome,
      changes: input.changes.length > 0 ? input.changes : run.changes,
    }
    if (!this.database.db) {
      memory.aiRuns.set(runId, next)
      return next
    }
    const updated = await this.database.db
      .update(aiRuns)
      .set({
        reviewStatus: input.outcome,
        changes: next.changes,
      })
      .where(eq(aiRuns.id, runId))
      .returning()
    return updated[0] ?? next
  }

  async listAiRuns(userId: string, documentId: string) {
    await this.get(userId, documentId)
    if (!this.database.db) {
      return [...memory.aiRuns.values()]
        .filter((run) => run.documentId === documentId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }
    return this.database.db
      .select()
      .from(aiRuns)
      .where(eq(aiRuns.documentId, documentId))
      .orderBy(desc(aiRuns.createdAt))
  }

  async saveFile(record: {
    id: string
    userId: string
    documentId: string | null
    filename: string
    mimeType: string
    sizeBytes: number
    storagePath: string
    extractedText: string | null
    status: 'uploading' | 'ready' | 'failed'
  }) {
    const stored = { ...record, createdAt: new Date() }
    if (!this.database.db) {
      memory.files.set(record.id, stored)
      return stored
    }
    const inserted = await this.database.db.insert(files).values(stored).returning()
    return inserted[0]!
  }

  async getFile(userId: string, id: string) {
    if (!this.database.db) {
      const file = memory.files.get(id)
      if (!file || file.userId !== userId) throw new NotFoundException('File not found')
      return file
    }
    const rows = await this.database.db
      .select()
      .from(files)
      .where(and(eq(files.id, id), eq(files.userId, userId)))
    const file = rows[0]
    if (!file) throw new NotFoundException('File not found')
    return file
  }

  async listFiles(userId: string, documentId?: string) {
    if (!this.database.db) {
      return [...memory.files.values()].filter(
        (file) =>
          file.userId === userId && (!documentId || file.documentId === documentId),
      )
    }
    const rows = await this.database.db
      .select()
      .from(files)
      .where(eq(files.userId, userId))
    return documentId ? rows.filter((file) => file.documentId === documentId) : rows
  }
}
