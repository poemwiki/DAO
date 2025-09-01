import React from 'react'
import { useTranslation } from 'react-i18next'
import { getDisplayStatusInfo } from '@/utils/proposal'
import type { Proposal } from '@/types'
import type { GovernorStateCode } from '@/utils/governor'
import Badge from '@/components/ui/Badge'
import { FiRadio } from 'react-icons/fi'

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
  const pulse = info.status === 'active' ? 'animate-pulse-slow' : ''
  return (
    <Badge
      color={info.badgeColor || 'neutral'}
      className={`${pulse} ${className} flex items-center gap-1 !dark:text-white`}
      title={detail}
      data-status={info.status}
    >
      {info.status === 'active' && <FiRadio className="inline-block" />}
      {label}
    </Badge>
  )
}

export default ProposalStatusBadge
