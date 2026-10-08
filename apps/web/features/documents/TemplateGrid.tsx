'use client'

import { useRouter } from 'next/navigation'
import type { TemplateMeta } from '@docai/shared'
import { api } from '@/lib/api'

export function TemplateGrid({ templates }: { templates: TemplateMeta[] }) {
  const router = useRouter()

  async function open(templateId: TemplateMeta['id']) {
    try {
      const doc = await api.createDocument({ templateId })
      router.push(`/d/${doc.id}`)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not create document')
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => open(template.id)}
          className="group text-left"
        >
          <div className="aspect-[3/4] rounded-xl border border-line bg-white p-4 shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md">
            <div className="h-full rounded-md border border-dashed border-line bg-mist/60 p-2">
              <div className="mb-2 h-2 w-2/3 rounded bg-forest/20" />
              <div className="space-y-1">
                <div className="h-1.5 rounded bg-forest/10" />
                <div className="h-1.5 w-5/6 rounded bg-forest/10" />
                <div className="h-1.5 w-4/6 rounded bg-forest/10" />
              </div>
            </div>
          </div>
          <div className="mt-2 text-sm font-medium text-forest">{template.name}</div>
          <div className="text-xs text-muted">{template.description}</div>
        </button>
      ))}
    </div>
  )
}
