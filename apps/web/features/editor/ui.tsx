'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

export function IconButton({
  active,
  onClick,
  disabled,
  title,
  children,
}: {
  active?: boolean
  onClick: () => void
  disabled?: boolean
  title?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-md disabled:opacity-40 ${
        active ? 'bg-sage text-forest' : 'text-forest-2 hover:bg-mist'
      }`}
    >
      {children}
    </button>
  )
}

export function ToolbarDivider() {
  return <span className="mx-1 h-5 w-px bg-line" />
}

export function Dropdown({
  label,
  align = 'left',
  width = 'w-56',
  children,
}: {
  label: ReactNode
  align?: 'left' | 'right'
  width?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onPointer)
    return () => window.removeEventListener('mousedown', onPointer)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm text-forest-2 hover:bg-mist"
      >
        {label}
      </button>
      {open ? (
        <div
          className={`absolute z-40 mt-1 rounded-md border border-line bg-white py-1 shadow-lg ${width} ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

export function MenuItem({
  onClick,
  shortcut,
  active,
  children,
}: {
  onClick: () => void
  shortcut?: string
  active?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-mist ${
        active ? 'text-leaf' : 'text-forest'
      }`}
    >
      <span>{children}</span>
      {shortcut ? <span className="ml-6 text-[11px] text-muted">{shortcut}</span> : null}
    </button>
  )
}

export function DialogShell({
  title,
  onClose,
  children,
  width = 'w-[min(480px,calc(100vw-2rem))]',
}: {
  title: string
  onClose: () => void
  children: ReactNode
  width?: string
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/25 print:hidden">
      <div className={`rounded-xl border border-line bg-white p-4 shadow-xl ${width}`}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-forest">{title}</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-forest">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
