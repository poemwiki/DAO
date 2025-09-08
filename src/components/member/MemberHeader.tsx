import { Avatar } from '@/components/ui/Avatar'
import { useDisplayName } from '@/hooks/useDisplayName'

interface MemberHeaderProps {
  address: string
}

export function MemberHeader({ address }: MemberHeaderProps) {
  const displayName = useDisplayName({ address })

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <div className="flex items-center gap-5">
        <Avatar address={address} size={72} />
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{displayName}</h1>
          {displayName !== address && (
            <p className="text-secondary font-mono text-xs md:text-sm break-all select-all">
              {address}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
