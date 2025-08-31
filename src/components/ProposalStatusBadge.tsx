import React from 'react'
import { useTranslation } from 'react-i18next'
import { getDisplayStatusInfo } from '@/utils/proposal'
import type { Proposal } from '@/types'
import type { GovernorStateCode } from '@/utils/governor'
import Badge from '@/components/ui/Badge'

interface ProposalStatusBadgeProps {
  proposal: Proposal
  numericCode?: GovernorStateCode | null
  className?: string
}

// Simple tooltip using title attribute to avoid extra dependency; could be replaced with a popover later.
export const ProposalStatusBadge: React.FC<ProposalStatusBadgeProps> = ({
  proposal,
  numericCode = null,
  className = '',
}) => {
  const { t } = useTranslation()
  const info = getDisplayStatusInfo(proposal, numericCode)
  const label = info.i18nKey ? t(info.i18nKey) : info.status
  const detail = info.detailI18nKey ? t(info.detailI18nKey) : ''
  const emoji = info.emoji ? `${info.emoji} ` : ''
  return (
    <Badge
      color={info.badgeColor || 'neutral'}
      className={className}
      title={detail}
      data-status={info.status}
      leftIcon={emoji ? <span>{emoji}</span> : undefined}
    >
      {label}
    </Badge>
  )
}

export default ProposalStatusBadge
