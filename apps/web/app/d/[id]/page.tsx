import { EditorWorkspace } from '@/features/editor/EditorWorkspace'

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <EditorWorkspace key={id} documentId={id} />
}
