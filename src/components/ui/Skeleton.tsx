import { cn } from '@/utils/format'

interface SkeletonProps {
  className?: string
  rounded?: string | boolean
}

// WHY: Central lightweight skeleton block (avoid repeating pulse div markup)
export function Skeleton({ className, rounded = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden animate-pulse bg-skeleton',
        rounded === true && 'rounded-md',
        typeof rounded === 'string' && rounded,
        className,
      )}
      aria-hidden
    />
  )
}

  /** Stats cards skeleton (3 cards; third hidden on small screens to match layout) */
  export function StatsSkeleton({ labels }: { labels: string[] }) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {labels.map((label, idx) => (
          <div
            key={idx}
            className={cn(
              'p-6 border rounded-lg bg-card',
              idx === 2 && 'hidden md:block',
            )}
          >
            <div className="text-2xl font-bold">
              <Skeleton className="h-8 w-12" />
            </div>
            <div className="text-sm">{label}</div>
          </div>
        ))}
      </div>
    )
  }

  /** Grid list skeleton for proposals */
  export function ProposalListSkeleton({ count = 4 }: { count?: number }) {
    return (
      <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-4 sm:p-6 border rounded-lg bg-card hover:border-primary transition-colors"
          >
            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex justify-start items-start md:items-center gap-2 flex-col md:flex-row">
                    <Skeleton className="h-7 w-2/3" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-1">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  /** Full proposal detail page skeleton */
  export function ProposalPageSkeleton() {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
        </div>
        <header className="flex flex-col gap-4 border-b pb-6">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-40" />
        </header>
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-start md:gap-8">
            <div className="md:w-2/3 space-y-8 mb-8 md:mb-0">
              <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="md:w-1/3 w-full space-y-6">
              {/* ProposalVotePanel skeleton */}
              <div className="space-y-3">
                <Skeleton className="h-6 w-24" />
                <div className="p-4 border rounded-md bg-background/50 space-y-3">
                  <div className="flex gap-3">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 flex-1" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
              {/* ProposalResults skeleton */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="p-4 border rounded-md bg-background/50 space-y-4">
                  <Skeleton className="h-3 w-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </div>
              {/* ProposalTimeline skeleton */}
              <div className="space-y-3">
                <Skeleton className="h-6 w-20" />
                <div className="space-y-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="relative pl-8">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

export default Skeleton