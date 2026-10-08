import { DocumentList } from '@/features/documents/DocumentList'

export default function RecentPage() {
  return (
    <div className="px-8 py-8">
      <h1 className="serif text-3xl text-forest">Recent</h1>
      <DocumentList />
    </div>
  )
}
