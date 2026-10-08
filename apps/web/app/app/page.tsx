import { TEMPLATES } from '@docai/shared'
import { TemplateGrid } from '@/features/documents/TemplateGrid'
import { DocumentList } from '@/features/documents/DocumentList'

export default function DashboardPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-sm text-muted">Start with a template</p>
          <h1 className="serif text-3xl text-forest">What will you write today?</h1>
        </div>
      </div>
      <TemplateGrid templates={TEMPLATES} />
      <h2 className="mt-12 text-sm font-semibold uppercase tracking-wide text-muted">
        Recent documents
      </h2>
      <DocumentList />
    </div>
  )
}
