import { useTranslation } from 'react-i18next'
import { formatVoteSupport, supportColor, supportIcon } from '@/utils/votes'

interface VoteSupportBadgeProps {
  support: number
  showIcon?: boolean
  className?: string
}

export function VoteSupportBadge({ support, showIcon = false, className = '' }: VoteSupportBadgeProps) {
  const { t } = useTranslation()
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${supportColor(support)} ${className}`}>
      {showIcon && (
        <span className="mr-1">
          {supportIcon(support)}
        </span>
      )}
      {formatVoteSupport(support, t)}
    </span>
  )
}