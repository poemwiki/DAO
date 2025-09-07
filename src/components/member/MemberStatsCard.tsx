interface MemberStatsCardProps {
  title: string
  value: string | number
  suffix?: string
  isLoading?: boolean
}

export function MemberStatsCard({ title, value, suffix, isLoading }: MemberStatsCardProps) {
  return (
    <div className="rounded-lg border bg-card/80 backdrop-blur-sm p-5 flex flex-col gap-1 hover:bg-card transition-colors">
      <div className="text-xs uppercase tracking-wide text-secondary/80">
        {title}
      </div>
      <div className="text-2xl font-semibold font-mono tabular-nums">
        {isLoading ? (
          <div className="animate-pulse bg-skeleton rounded h-6 w-16" />
        ) : (
          <>
            {value}
            {suffix && ` ${suffix}`}
          </>
        )}
      </div>
    </div>
  )
}