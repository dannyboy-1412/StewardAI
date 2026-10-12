import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  customType,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import type { JSONContent, PageSettings } from '@docai/document'

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => 'bytea',
})

export const versionSourceEnum = pgEnum('version_source', [
  'manual',
  'ai',
  'autosave',
])

export const fileStatusEnum = pgEnum('file_status', [
  'uploading',
  'ready',
  'failed',
])

export const aiRunStatusEnum = pgEnum('ai_run_status', [
  'running',
  'completed',
  'failed',
  'cancelled',
])

export const aiRunReviewStatusEnum = pgEnum('ai_run_review_status', [
  'pending',
  'accepted',
  'partial',
  'rejected',
])

export const citationStyleEnum = pgEnum('citation_style', [
  'apa7',
  'harvard',
  'aglc4',
  'ieee',
  'vancouver',
])

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id, {
    onDelete: 'set null',
  }),
  title: text('title').notNull(),
  ydocState: bytea('ydoc_state'),
  contentJson: jsonb('content_json').$type<JSONContent>().notNull(),
  pageSettings: jsonb('page_settings').$type<PageSettings>().notNull().default({
    paperSize: 'A4',
    orientation: 'portrait',
    marginTop: 1,
    marginBottom: 1,
    marginLeft: 1,
    marginRight: 1,
    pageColor: '#ffffff',
    headerText: '',
    footerText: '',
    showPageNumbers: true,
  }),
  citationStyle: citationStyleEnum('citation_style').notNull().default('apa7'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const documentVersions = pgTable('document_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  contentJson: jsonb('content_json').$type<JSONContent>().notNull(),
  ydocState: bytea('ydoc_state'),
  label: text('label'),
  source: versionSourceEnum('source').notNull(),
  aiRunId: uuid('ai_run_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  documentId: uuid('document_id').references(() => documents.id, {
    onDelete: 'set null',
  }),
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  storagePath: text('storage_path').notNull(),
  extractedText: text('extracted_text'),
  status: fileStatusEnum('status').notNull().default('uploading'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const aiRuns = pgTable('ai_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull(),
  model: text('model').notNull(),
  status: aiRunStatusEnum('status').notNull().default('running'),
  ops: jsonb('ops').$type<unknown[]>().notNull().default([]),
  error: text('error'),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  responseText: text('response_text'),
  changes: jsonb('changes').$type<unknown[]>().notNull().default([]),
  reviewStatus: aiRunReviewStatusEnum('review_status'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
})

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  documents: many(documents),
}))

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, { fields: [documents.userId], references: [users.id] }),
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
  versions: many(documentVersions),
  files: many(files),
  aiRuns: many(aiRuns),
}))
