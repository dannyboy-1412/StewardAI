'use client'

import { useState } from 'react'
import type { PageSettings } from '@docai/document'
import { DialogShell } from '../ui'

export function PageSetupDialog({
  value,
  onClose,
  onSave,
}: {
  value: PageSettings
  onClose: () => void
  onSave: (next: PageSettings) => void
}) {
  const [settings, setSettings] = useState(value)

  function field<K extends keyof PageSettings>(key: K, next: PageSettings[K]) {
    setSettings((current) => ({ ...current, [key]: next }))
  }

  return (
    <DialogShell title="Page setup" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <label className="grid gap-1">
          Paper size
          <select
            value={settings.paperSize}
            onChange={(event) => field('paperSize', event.target.value === 'Letter' ? 'Letter' : 'A4')}
            className="h-9 rounded-md border border-line px-2"
          >
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
          </select>
        </label>
        <label className="grid gap-1">
          Orientation
          <select
            value={settings.orientation}
            onChange={(event) =>
              field('orientation', event.target.value === 'landscape' ? 'landscape' : 'portrait')
            }
            className="h-9 rounded-md border border-line px-2"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>
        {(['marginTop', 'marginBottom', 'marginLeft', 'marginRight'] as const).map((key) => (
          <label key={key} className="grid gap-1">
            {key.replace('margin', 'Margin ')}
            <input
              type="number"
              min={0}
              max={4}
              step={0.25}
              value={settings[key]}
              onChange={(event) => field(key, Number(event.target.value))}
              className="h-9 rounded-md border border-line px-2"
            />
          </label>
        ))}
        <label className="col-span-2 grid gap-1">
          Page color
          <input
            type="color"
            value={settings.pageColor}
            onChange={(event) => field('pageColor', event.target.value)}
            className="h-9 w-full rounded-md border border-line"
          />
        </label>
        <label className="col-span-2 grid gap-1">
          Header
          <input
            value={settings.headerText}
            onChange={(event) => field('headerText', event.target.value)}
            className="h-9 rounded-md border border-line px-2"
          />
        </label>
        <label className="col-span-2 grid gap-1">
          Footer
          <input
            value={settings.footerText}
            onChange={(event) => field('footerText', event.target.value)}
            className="h-9 rounded-md border border-line px-2"
          />
        </label>
        <label className="col-span-2 flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={settings.showPageNumbers}
            onChange={(event) => field('showPageNumbers', event.target.checked)}
          />
          Show page numbers
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className="rounded-md bg-forest px-3 py-1.5 text-sm text-white"
          onClick={() => onSave(settings)}
        >
          Save
        </button>
      </div>
    </DialogShell>
  )
}
