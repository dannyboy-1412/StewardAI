export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <span className="grid h-7 w-7 place-items-center rounded-full bg-forest text-white">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 19c4-9 10-12 14-13-1 5-4 10-8 13" />
          <path d="M8 13c2 .5 4 2 5 4" />
        </svg>
      </span>
      Writee
    </span>
  )
}
