import React from 'react'
import { useTranslation } from 'react-i18next'
import { getDisplayStatusInfo } from '@/utils/proposal'
import type { Proposal } from '@/types'
import type { GovernorStateCode } from '@/utils/governor'

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
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-100 ${className}`}
      title={detail}
      data-status={info.status}
    >
      {emoji}{label}
    </span>
  )
}

export default ProposalStatusBadge
