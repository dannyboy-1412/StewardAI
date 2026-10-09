import { z } from 'zod'

export const createDocumentBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  templateId: z.string().min(1).optional(),
  projectId: z.string().uuid().nullable().optional(),
})

export const pageSettingsSchema = z.object({
  paperSize: z.enum(['A4', 'Letter']).default('A4'),
  orientation: z.enum(['portrait', 'landscape']).default('portrait'),
  marginTop: z.number().min(0).max(4).default(1),
  marginBottom: z.number().min(0).max(4).default(1),
  marginLeft: z.number().min(0).max(4).default(1),
  marginRight: z.number().min(0).max(4).default(1),
  pageColor: z.string().min(1).max(32).default('#ffffff'),
  headerText: z.string().max(200).default(''),
  footerText: z.string().max(200).default(''),
  showPageNumbers: z.boolean().default(true),
})

export type PageSettingsInput = z.infer<typeof pageSettingsSchema>

export const updateDocumentBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  projectId: z.string().uuid().nullable().optional(),
  pageSettings: pageSettingsSchema.optional(),
})

export const createProjectBodySchema = z.object({
  name: z.string().min(1).max(120),
})

export const aiRunBodySchema = z.object({
  instruction: z.string().min(1).max(20_000),
  selectionBlockIds: z.array(z.string()).default([]),
  fileIds: z.array(z.string().uuid()).default([]),
  snapshot: z.unknown().optional(),
  mode: z.enum(['edit', 'ask']).default('edit'),
})

export type CreateDocumentBody = z.infer<typeof createDocumentBodySchema>
export type UpdateDocumentBody = z.infer<typeof updateDocumentBodySchema>
export type CreateProjectBody = z.infer<typeof createProjectBodySchema>
export type AiRunBody = z.infer<typeof aiRunBodySchema>

export const documentSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  projectId: z.string().uuid().nullable(),
  updatedAt: z.string(),
  createdAt: z.string(),
})

export type DocumentSummary = z.infer<typeof documentSummarySchema>

export type TemplateId =
  | 'blank'
  | 'research-report'
  | 'essay'
  | 'project-proposal'
  | 'case-study'

export type TemplateMeta = {
  id: TemplateId
  name: string
  description: string
  category: 'academic' | 'reports' | 'essays' | 'projects' | 'business'
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: 'blank',
    name: 'Blank document',
    description: 'Start from an empty page',
    category: 'academic',
  },
  {
    id: 'research-report',
    name: 'Research Report',
    description: 'Detailed academic report with citations',
    category: 'reports',
  },
  {
    id: 'essay',
    name: 'Essay',
    description: 'Structured essay with references',
    category: 'essays',
  },
  {
    id: 'project-proposal',
    name: 'Project Proposal',
    description: 'For university and work projects',
    category: 'projects',
  },
  {
    id: 'case-study',
    name: 'Case Study',
    description: 'Professional case study format',
    category: 'business',
  },
]
