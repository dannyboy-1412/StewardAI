'use client'

import { useMemo, useState } from 'react'
import {
  attachReasons,
  buildReviewPreviewDoc,
  composeAcceptedPatches,
  diffTopLevelBlocks,
  type JSONContent,
  type ProposedChange,
} from '@docai/document'

export type PendingReview = {
  runId: string
  base: JSONContent
  proposed: JSONContent
  changes: ProposedChange[]
}

export function usePendingReview() {
  const [pending, setPending] = useState<PendingReview | null>(null)
  const [acceptedIds, setAcceptedIds] = useState<string[]>([])

  function start(input: {
    runId: string
    base: JSONContent
    proposed: JSONContent
    changes?: ProposedChange[]
    reasonsByBlockId?: Record<string, string>
  }) {
    const changes =
      input.changes && input.changes.length > 0
        ? attachReasons(input.changes, input.reasonsByBlockId ?? {})
        : diffTopLevelBlocks(input.base, input.proposed, input.reasonsByBlockId ?? {})
    setPending({
      runId: input.runId,
      base: input.base,
      proposed: input.proposed,
      changes,
    })
    setAcceptedIds(changes.map((change) => change.id))
  }

  function toggle(id: string, accepted: boolean) {
    setAcceptedIds((current) => {
      if (accepted) return current.includes(id) ? current : [...current, id]
      return current.filter((item) => item !== id)
    })
  }

  function acceptAll() {
    setAcceptedIds(pending?.changes.map((change) => change.id) ?? [])
  }

  function rejectAll() {
    setAcceptedIds([])
  }

  function clear() {
    setPending(null)
    setAcceptedIds([])
  }

  const preview = useMemo(
    () => (pending ? buildReviewPreviewDoc(pending.base, pending.proposed, pending.changes) : null),
    [pending],
  )

  const composed = useMemo(() => {
    if (!pending) return null
    return composeAcceptedPatches(pending.base, pending.changes, acceptedIds)
  }, [pending, acceptedIds])

  const outcome: 'accepted' | 'partial' | 'rejected' =
    !pending || acceptedIds.length === 0
      ? 'rejected'
      : acceptedIds.length === pending.changes.length
        ? 'accepted'
        : 'partial'

  return {
    pending,
    acceptedIds,
    preview,
    composed,
    outcome,
    start,
    toggle,
    acceptAll,
    rejectAll,
    clear,
  }
}
