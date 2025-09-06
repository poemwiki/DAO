import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ProposalStatusBadge from '@/components/ProposalStatusBadge'
import Badge from '@/components/ui/Badge'
import { ROUTES } from '@/constants'
import { buildProposalTitle, getDisplayDescription } from '@/utils/proposal'
import { parseProposalActions } from '@/lib/parseProposalActions'
import { formatRelativeTime, formatGraphTimestamp } from '@/utils/format'
import { useEstimateBlockTimestamp } from '@/hooks/useEstimateBlockTimestamp'
import type { Proposal } from '@/types'
import { useTokenInfo } from '@/hooks/useTokenInfo'
import { GovernorStateCode } from '@/utils/governor'

interface Props {
  proposal: Proposal
  numericCode: GovernorStateCode | null
  proposalNumber: number
}

// Show countdown (pending/active) else show final end date (date only)
const ACTIVE_CODES = new Set([0, 1])

export function ProposalListItem({
  proposal,
  numericCode,
  proposalNumber,
}: Props) {
  const { t } = useTranslation()
  const { data: tokenInfo } = useTokenInfo()
  const desc = proposal.description || ''
  const parsedActions = parseProposalActions(
    proposal.targets || [],
    proposal.calldatas || [],
    proposal.signatures || [],
    tokenInfo?.decimals,
    tokenInfo?.symbol,
  )
  const displayTitle = buildProposalTitle(proposal.description, parsedActions, t)
  const displayDescription = getDisplayDescription(proposal.description)

  // Estimate end timestamp using block number (more accurate than treating block as unix time)
  const endBlockNum = proposal.endBlock ? Number(proposal.endBlock) : undefined
  const { data: endInfo } = useEstimateBlockTimestamp(endBlockNum, { exact: false })

  let timeLabel = `${t('home.votingEndedAt')}: -`
  if (endInfo?.timestamp) {
    if (numericCode !== null && ACTIVE_CODES.has(numericCode)) {
      // pending / active -> remaining time (relative future)
      timeLabel = `${t('home.votingEndsIn')}: ${formatRelativeTime(
        endInfo.timestamp,
        t('lang') as string,
      )}`
    } else {
      // finalized or other states -> date only (no time of day)
      timeLabel = `${t('home.votingEndedAt')} ${formatGraphTimestamp(
        endInfo.timestamp,
        t('lang') as string,
      )}`
    }
  }

  return (
    <Link
      key={proposal.id}
      to={ROUTES.PROPOSAL.replace(':id', proposal.id)}
      className="block p-4 sm:p-6 border rounded-lg hover:border-primary transition-colors bg-card"
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex justify-start items-start md:items-center gap-2 flex-col md:flex-row">
              <h3 className="text-lg font-semibold break-words flex-1 min-w-0">
                {displayTitle}
              </h3>
              <Badge color="slate" outline={true}>
                Proposal #{proposalNumber}
              </Badge>
            </div>
            <p className="text-secondary line-clamp-1 break-words text-sm sm:text-base">
              {displayDescription}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-1 text-xs">
          <span className={numericCode === null ? 'invisible' : 'visible'}>
            <ProposalStatusBadge
              proposal={proposal}
              numericCode={numericCode}
            />
          </span>
          <span>{timeLabel}</span>
        </div>
      </div>
    </Link>
  )
}

export default ProposalListItem
