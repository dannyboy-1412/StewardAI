import { TEMPLATES } from '@docai/shared'
import { TemplateGrid } from '@/features/documents/TemplateGrid'

export default function TemplatesPage() {
  return (
    <div className="px-8 py-8">
      <h1 className="serif text-3xl text-forest">Templates</h1>
      <p className="mt-2 text-muted">Start from a structure, then let AI fill it in.</p>
      <div className="mt-8">
        <TemplateGrid templates={TEMPLATES} />
      </div>
    </div>
  )
}
