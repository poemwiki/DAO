import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatUnits } from 'viem'
import { Link } from 'react-router-dom'
import type { Proposal, Transfer } from '@/types'
import { useMemberTransfers } from '@/hooks/useMemberTransfers'
import { useTokenInfo } from '@/hooks/useTokenInfo'
import { useQuery } from '@tanstack/react-query'
import { getProposals } from '@/graphql'
import { ROUTES } from '@/constants'
import { getProposalTitle } from '@/utils/proposal'
import { TokenInfoResult } from '@/queries/tokenInfo'
import { getExplorerTxUrl } from '@/config'
import { short } from '@/utils/format'

interface MemberTransferHistoryProps {
  address: string
}

interface TransferRowProps {
  transfer: Transfer
  memberAddress: string
  tokenInfo?: TokenInfoResult
  proposalsMap: Record<string, Proposal>
}

function TransferRow({
  transfer,
  memberAddress,
  tokenInfo,
  proposalsMap,
}: TransferRowProps) {
  const { t } = useTranslation()
  const isReceiving = transfer.to.id.toLowerCase() === memberAddress.toLowerCase()
  const related = proposalsMap[transfer.tx?.toLowerCase()]

  // Derive proposal title similar to MemberVoteHistory logic
  let proposalTitle: string | null = null
  if (related?.description) {
    proposalTitle = getProposalTitle(related)
  }

  const amount = tokenInfo ? formatUnits(BigInt(transfer.value), tokenInfo.decimals) : '0'

  return (
    <tr className="font-mono text-xs bg-background border-b hover:bg-card">
      <td className="px-6 py-4">
        <span className="text-sm">
          {isReceiving
            ? t('member.transfers.directionType.received')
            : t('member.transfers.directionType.sent')}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="font-mono text-sm tabular-nums">
          {Number.parseFloat(amount).toFixed(2)}
        </div>
        <div className="text-xs text-secondary/70">{tokenInfo?.symbol}</div>
      </td>
      <td className="px-6 py-4 text-xs md:text-sm max-w-[220px]">
        {related ? (
          <Link
            to={ROUTES.PROPOSAL.replace(':id', related.id)}
            className="text-primary hover:underline font-mono line-clamp-2"
            title={proposalTitle || `#${related.proposalId || related.id}`}
          >
            {proposalTitle
              ? proposalTitle.length > 60
                ? `${proposalTitle.slice(0, 60)}...`
                : proposalTitle
              : `#${related.proposalId || related.id}`}
          </Link>
        ) : (
          <span className="text-secondary/60">-</span>
        )}
      </td>
      <td className="px-6 py-4 text-secondary">
        {new Date(Number(transfer.createdAt) * 1000).toLocaleDateString()}
      </td>
      <td className="px-6 py-4">
        <a
          href={getExplorerTxUrl(transfer.tx)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
        >
          <ExternalLink size={12} />
          {short(transfer.tx)}
        </a>
      </td>
    </tr>
  )
}

export function MemberTransferHistory({ address }: MemberTransferHistoryProps) {
  const { t } = useTranslation()
  const { transfers, isLoading, error } = useMemberTransfers(address)
  const { data: tokenInfo } = useTokenInfo()
  const { data: proposalsData } = useQuery({
    queryKey: ['memberPageProposals'],
    queryFn: getProposals,
    staleTime: 60_000,
  })

  const proposalsMap: Record<string, Proposal> = (proposalsData && proposalsData.proposals
    ? proposalsData.proposals
    : []).reduce(
    (acc, p) => {
      if (p) {
        ;['proposeTx', 'executeTx', 'cancelTx'].forEach(k => {
          const tx = p[k as 'executeTx' | 'proposeTx' | 'cancelTx']
          if (tx) acc[tx] = p
        })
      }
      return acc
    },
    {} as Record<string, Proposal>,
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-secondary">
          {t('common.loading')}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-destructive">
          {t('member.transfers.error')}
        </div>
      </div>
    )
  }

  if (!transfers || transfers.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-secondary">
          {t('member.transfers.noTransfers')}
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto border rounded-lg bg-card/30 backdrop-blur-sm">
      <table className="w-full">
        <thead className="bg-card">
          <tr className="border-b border-border/50">
            <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-secondary/80">
              {t('member.transfers.direction')}
            </th>
            <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wide text-secondary/80">
              {t('member.transfers.amount')}
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-secondary/80">
              {t('member.transfers.relatedProposal')}
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
          {transfers.map(transfer => (
            <TransferRow
              key={transfer.id}
              transfer={transfer}
              memberAddress={address}
              tokenInfo={tokenInfo}
              proposalsMap={proposalsMap}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
