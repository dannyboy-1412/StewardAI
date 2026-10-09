type SectionHeadingProps = {
  eyebrow: string
  title: string
  description?: string
  align?: 'center' | 'left'
}

export function SectionHeading({ eyebrow, title, description, align = 'center' }: SectionHeadingProps) {
  const alignment = align === 'center' ? 'mx-auto text-center' : ''
  return (
    <div className={`max-w-2xl ${alignment}`}>
      <p className="text-sm italic text-leaf">{eyebrow}</p>
      <h2 className="serif mt-3 text-4xl leading-tight tracking-tight text-forest md:text-[44px]">
        {title}
      </h2>
      {description ? <p className="mt-4 text-[17px] leading-7 text-muted">{description}</p> : null}
    </div>
  )
}
