import type { Proposal, VoteCastEntity } from '@/types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { formatUnits } from 'viem'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/button'
import { VoteSupportBadge } from '@/components/VoteSupportBadge'
import { ROUTES } from '@/constants'
import { useDisplayName } from '@/hooks/useDisplayName'
import { useTokenInfo } from '@/hooks/useTokenInfo'

interface VotesListProps {
  proposal: Proposal
}

export function VotesList({ proposal }: VotesListProps) {
  const { t } = useTranslation()
  const { data: tokenInfo } = useTokenInfo()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const votes = proposal.voteCasts || []
  const visibleVotes = showAll ? votes : votes.slice(0, 10)

  if (!votes.length) {
    return (
      <div className="text-center text-sm text-secondary py-4">
        {t('member.votes.noVotes')}
      </div>
    )
  }


  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-semibold">
          {t('proposal.vote.details')} ({votes.length})
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm"
        >
          {isExpanded ? (
            <>
              <ChevronUp size={16} />
              {t('common.close')}
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              {t('common.showDetails')}
            </>
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-2">
          <div className="max-h-64 overflow-y-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-card sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-secondary">
                    {t('member.votes.voter')}
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-secondary">
                    {t('member.votesExtra.support')}
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-secondary">
                    {t('member.votesExtra.weight')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleVotes.map(vote => (
                  <VoteRow
                    key={vote.id}
                    vote={vote}
                    tokenInfo={tokenInfo}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {votes.length > 10 && !showAll && (
            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(true)}
                className="text-sm"
              >
                {t('common.showMore')} ({t('common.moreCount', { count: votes.length - 10 })})
              </Button>
            </div>
          )}

          {showAll && votes.length > 10 && (
            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAll(false)
                  // Scroll back to top of vote list
                  document.querySelector('.max-h-64')?.scrollTo({ top: 0 })
                }}
                className="text-sm"
              >
                {t('common.showLess')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface VoteRowProps {
  vote: VoteCastEntity
  tokenInfo: any
}

function VoteRow({
  vote,
  tokenInfo,
}: VoteRowProps) {
  const voterName = useDisplayName({ address: vote.voter.id })
  const weight = tokenInfo ? formatUnits(BigInt(vote.weight), tokenInfo.decimals) : '0'

  return (
    <tr className="border-b hover:bg-card">
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <Avatar address={vote.voter.id} size={20} />
          <Link
            to={ROUTES.MEMBER.replace(':address', vote.voter.id)}
            className="text-primary hover:underline font-medium"
          >
            {voterName}
          </Link>
        </div>
      </td>
      <td className="px-3 py-2 text-center">
        <VoteSupportBadge support={vote.support} />
      </td>
      <td className="px-3 py-2 text-right font-mono text-xs">
        {Number.parseFloat(weight).toFixed(2)} {tokenInfo?.symbol}
      </td>
    </tr>
  )
}