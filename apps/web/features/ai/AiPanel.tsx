'use client'

export type ChatItem = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export function AiPanel({
  items,
  busy,
  onStop,
}: {
  items: ChatItem[]
  busy: boolean
  onStop: () => void
}) {
  return (
    <aside className="flex w-80 flex-col border-l border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-forest">AI</h2>
        {busy && (
          <button onClick={onStop} className="text-xs text-red-700">
            Stop
          </button>
        )}
      </div>
      <div className="flex-1 space-y-3 overflow-auto p-4 text-sm">
        {items.length === 0 && (
          <p className="text-muted">Prompts and answers show up here. The document updates in place.</p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl px-3 py-2 ${
              item.role === 'user' ? 'bg-sage text-forest' : 'bg-mist text-forest-2'
            }`}
          >
            {item.text}
          </div>
        ))}
        {busy && <p className="text-xs text-muted">Working on the document…</p>}
      </div>
    </aside>
  )
}
