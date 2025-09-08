import type { ReactNode } from 'react'

interface MemberSectionProps {
  title: string
  description?: string
  children: ReactNode
}

export function MemberSection({ title, description, children }: MemberSectionProps) {
  return (
    <section className="rounded-lg border bg-card/70 backdrop-blur-sm p-6 md:p-7 space-y-4 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-secondary leading-relaxed">
            {description}
          </p>
        )}
      </header>
      <div>
        {children}
      </div>
    </section>
  )
}
