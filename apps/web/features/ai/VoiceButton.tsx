'use client'

import { Mic, Square } from 'lucide-react'
import { useRef, useState } from 'react'
import { api } from '@/lib/api'

export function VoiceButton({
  onTranscript,
}: {
  onTranscript: (text: string) => void
}) {
  const [recording, setRecording] = useState(false)
  const media = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  async function toggle() {
    if (recording) {
      media.current?.stop()
      setRecording(false)
      return
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    chunks.current = []
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.current.push(event.data)
    }
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop())
      const blob = new Blob(chunks.current, { type: recorder.mimeType })
      const { text } = await api.transcribe(blob)
      onTranscript(text)
    }
    media.current = recorder
    recorder.start()
    setRecording(true)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`grid h-9 w-9 place-items-center rounded-full ${
        recording ? 'bg-red-600 text-white' : 'bg-mist text-forest'
      }`}
      aria-label={recording ? 'Stop recording' : 'Speak'}
    >
      {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  )
}
