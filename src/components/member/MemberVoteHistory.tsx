import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { formatUnits } from 'viem'
import type { VoteCastEntity } from '@/types'
import { VoteSupportBadge } from '@/components/VoteSupportBadge'
import { getProposalTitle } from '@/utils/proposal'
import { useMemberVotesPages } from '@/hooks/useMemberVotesPages'
import { useTokenInfo } from '@/hooks/useTokenInfo'
import { TokenInfoResult } from '@/queries/tokenInfo'

interface MemberVoteHistoryProps {
  address: string
}

interface VoteRowProps {
  vote: VoteCastEntity
  tokenInfo: TokenInfoResult
}

function VoteRow({ vote, tokenInfo }: VoteRowProps) {
  const weight = tokenInfo ? formatUnits(BigInt(vote.weight), tokenInfo.decimals) : '0'

  // Unified title derivation via getProposalTitle utility
  const proposalTitle = vote.proposal
    ? getProposalTitle(vote.proposal)
    : ''

  return (
    <tr className="font-mono text-xs  bg-background border-b hover:bg-card">
      <td className="px-6 py-4">
        <div>
          {vote.proposal?.id ? (
            <Link
              to={`/proposal/${vote.proposal.id}`}
              className="font-medium hover:underline text-primary line-clamp-2"
            >
              {proposalTitle.length > 60
                ? `${proposalTitle.slice(0, 60)}...`
                : proposalTitle}
            </Link>
          ) : (
            <span className="font-medium text-secondary line-clamp-2">
              {proposalTitle.length > 60
                ? `${proposalTitle.slice(0, 60)}...`
                : proposalTitle}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <VoteSupportBadge support={vote.support} />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="font-mono text-sm tabular-nums">
          {Number.parseFloat(weight).toFixed(2)}
        </div>
        <div className="text-xs text-secondary/70">{tokenInfo?.symbol}</div>
      </td>
      <td className="px-6 py-4 text-secondary">
        {new Date(Number(vote.createdAt) * 1000).toLocaleDateString()}
      </td>
      <td className="px-6 py-4">
        <a
          href={`https://etherscan.io/tx/${vote.tx}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
        >
          <ExternalLink size={12} />
          {vote.tx.slice(0, 8)}...
        </a>
      </td>
    </tr>
  )
}

export function MemberVoteHistory({ address }: MemberVoteHistoryProps) {
  const { t } = useTranslation()
  // Using infinite pagination hook
  const { votes, voteStats, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useMemberVotesPages(address)
  const { data: tokenInfo } = useTokenInfo()


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-secondary">
          {t('common.loading')}
        </div>
      </div>
    )
  }

  if (error || !tokenInfo) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-destructive">
          {t('member.votes.error')}
        </div>
      </div>
    )
  }

  if (!votes || votes.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-secondary">
          {t('member.votes.noVotes')}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Vote Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
        <div className="p-4 border rounded-lg bg-card/60 backdrop-blur-sm text-center">
          <div className="text-2xl font-bold font-mono tabular-nums">
            {voteStats.totalVotes}
          </div>
          <div className="text-xs uppercase tracking-wide text-secondary/80 mt-1">
            {t('member.votes.total')}
          </div>
        </div>
        <div className="p-4 border rounded-lg bg-card/60 backdrop-blur-sm text-center">
          <div className="text-2xl font-bold font-mono tabular-nums">
            {voteStats.supportBreakdown.for}/
            {voteStats.supportBreakdown.against}/
            {voteStats.supportBreakdown.abstain}
          </div>
          <div className="text-xs uppercase tracking-wide text-secondary/80 mt-1">
            {t('member.votes.support.for')}/{t('member.votes.support.against')}/
            {t('member.votes.support.abstain')}
          </div>
        </div>
      </div>

      {/* Vote History Table */}
  <div className="overflow-x-auto border rounded-lg bg-card/30 backdrop-blur-sm">
        <table className="w-full">
          <thead className="bg-card">
            <tr className="border-b border-border/50">
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-secondary/80">
                {t('member.votesExtra.proposal')}
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-secondary/80">
                {t('member.votesExtra.support')}
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wide text-secondary/80">
                {t('member.votesExtra.weight')}
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-secondary/80">
                {t('member.transfers.timestamp')}
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-secondary/80">
                {t('member.transfers.transaction')}
              </th>
            </tr>
          </thead>
          <tbody>
            {votes.map(vote => (
              <VoteRow key={vote.id} vote={vote} tokenInfo={tokenInfo} />
            ))}
          </tbody>
        </table>
        <div className="p-4 flex items-center justify-center">
          {hasNextPage ? (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-4 py-2 text-xs rounded border bg-card hover:bg-card/70 disabled:opacity-50"
            >
              {isFetchingNextPage ? t('common.loading') : t('common.showMore')}
            </button>
          ) : (
            <div className="text-xs text-secondary/70">
              {t('common.showLess')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
