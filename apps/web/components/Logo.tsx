export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap font-semibold tracking-tight ${className}`}>
      <span className="grid h-7 w-7 place-items-center rounded-full bg-forest text-white">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16.5 4.5l3 3L8 19H5v-3L16.5 4.5z" />
          <path d="M14.2 6.8l3 3" />
        </svg>
      </span>
      PenPal <span className="font-medium text-leaf">AI</span>
    </span>
  )
}
