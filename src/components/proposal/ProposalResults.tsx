import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/Popover'
import { formatNumber, cn, toScaledNumber } from '@/utils/format'
import { useTranslation } from 'react-i18next'
import { useTokenInfo } from '@/hooks/useTokenInfo'
import { useGovernorQuorum } from '@/hooks/useGovernorQuorum'
import { usePastTotalSupply } from '@/hooks/usePastTotalSupply'
import type { Proposal } from '@/types'
import { FaPoll } from 'react-icons/fa'

export interface ProposalResultsProps {
  proposal: Proposal
}

export function ProposalResults({ proposal }: ProposalResultsProps) {
  const { t } = useTranslation()
  const { data: tokenInfo } = useTokenInfo()
  const startBlock = proposal?.startBlock
    ? Number(proposal.startBlock)
    : undefined
  const { data: quorumRaw } = useGovernorQuorum(startBlock)
  usePastTotalSupply(startBlock) // fetched for potential future debug; not directly displayed
  const decimals = tokenInfo?.decimals ?? 18
  const big = (s: string | number) =>
    typeof s === 'number' ? BigInt(s) : BigInt(s || '0')
  let forBN = 0n,
    againstBN = 0n,
    abstainBN = 0n
  ;(proposal?.voteCasts || []).forEach(v => {
    const w = big(v.weight)
    if (v.support === 0) {
      againstBN += w
    } else if (v.support === 1) {
      forBN += w
    } else if (v.support === 2) {
      abstainBN += w
    }
  })
  const totalBN = forBN + againstBN + abstainBN
  const scale = (bn: bigint) => toScaledNumber(bn, decimals)
  const votes = {
    for: scale(forBN),
    against: scale(againstBN),
    abstain: scale(abstainBN),
  }
  const totalVotes = scale(totalBN)
  const quorum = quorumRaw ? scale(quorumRaw as bigint) : undefined
  const quorumHelp = t('proposal.quorumHelp')
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center justify-between">
        <span className="flex items-center gap-2">
          <FaPoll />
          {t('proposal.results')}
        </span>
        <span className="text-sm font-normal">
          {formatNumber(totalVotes)} votes
        </span>
      </h2>
      <div className="p-4 border rounded-md bg-background/50 flex flex-col gap-4">
        <div className="h-3 w-full bg-card rounded-full overflow-hidden flex relative">
          {(['for', 'abstain', 'against'] as const).map(k => {
            const val = votes[k]
            const pct = totalVotes ? (val / totalVotes) * 100 : 0
            const color =
              k === 'for'
                ? 'bg-green-500'
                : k === 'against'
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
            return (
              <div
                key={k}
                style={{ width: `${pct}%` }}
                className={`${color} transition-all`}
                title={`${t(`proposal.vote.${k}`)} ${pct.toFixed(1)}%`}
              />
            )
          })}
          {quorum !== undefined && (
            <span
              className="absolute top-0 bottom-0 w-0.5 bg-blue-500"
              style={{
                left: `${totalVotes > 0 ? Math.min(100, (quorum / totalVotes) * 100) : 0}%`,
              }}
              title={`${t('proposal.quorum')}: ${formatNumber(quorum)}`}
            />
          )}
        </div>
        <div className="flex flex-col gap-2 text-xs">
          <ResultRow
            label={t('proposal.vote.for')}
            value={votes.for}
            total={totalVotes}
            color="text-green-600"
          />
          <ResultRow
            label={t('proposal.vote.against')}
            value={votes.against}
            total={totalVotes}
            color="text-red-600"
          />
          <ResultRow
            label={t('proposal.vote.abstain')}
            value={votes.abstain}
            total={totalVotes}
            color="text-yellow-500"
          />
          {quorum !== undefined && (
            <ResultRow
              label={t('proposal.quorum')}
              value={quorum}
              total={totalVotes}
              color="text-blue-500"
              isQuorum
              help={quorumHelp}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function ResultRow({
  label,
  value,
  total,
  color,
  isQuorum,
  help,
}: {
  label: string
  value: number | undefined
  total: number
  color?: string
  isQuorum?: boolean
  help?: string
}) {
  const pct =
    total && value !== undefined && total > 0 ? (value / total) * 100 : 0
  return (
    <div className="flex justify-between items-center">
      <span className={`flex items-center gap-1 ${color || ''}`}>
        <span>{label}</span>
        {help && (
          <Popover>
            <PopoverTrigger asChild>
              <span className="inline-block w-3 h-3 text-[10px] leading-2.5 text-center border rounded-full cursor-pointer select-none text-secondary">
                i
              </span>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              className="max-w-[220px] text-xs"
            >
              {help}
            </PopoverContent>
          </Popover>
        )}
      </span>
      <span className="tabular-nums font-medium">
        {value !== undefined ? formatNumber(value, 1) : '-'}
        <span
          className={cn('ml-2 inline-block w-12 text-right opacity-70', {
            invisible: isQuorum,
          })}
        >
          {`${pct.toFixed(1)}%`}
        </span>
      </span>
    </div>
  )
}
