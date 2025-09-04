import { useTranslation } from 'react-i18next'
import { getExplorerTxUrl } from '@/config'
import { useDisplayName } from '@/hooks/useDisplayName'
import { short, formatGraphTimestampLocalMinutes } from '@/utils/format'
import React from 'react'
import type { Proposal } from '@/types'
import { useEstimateBlockTimestamp } from '@/hooks/useEstimateBlockTimestamp'

export interface TimelineEvent {
  key: string
  label?: string
  ts?: number
  display: string
  block?: number
  accent?: string
  tx?: string
  type?: 'vote'
  voteAddress?: string
  voteSupport?: number
}

interface ProposalTimelineProps {
  proposal: Proposal
  startBlockNum?: number
  endBlockNum: number
  proposerName: string
}

export function ProposalTimeline({
  proposal,
  startBlockNum,
  endBlockNum,
  proposerName,
}: ProposalTimelineProps) {
  const { data: startInfo } = useEstimateBlockTimestamp(startBlockNum)
  const { data: endInfo } = useEstimateBlockTimestamp(endBlockNum)
  const { t } = useTranslation()
  const normalizeTs = (val?: string | number | null): number | undefined => {
    if (val === null || val === undefined) {
      return undefined
    }
    const n = typeof val === 'string' ? Number(val) : val
    if (!Number.isFinite(n)) {
      return undefined
    }
    return n < 1e12 ? n * 1000 : n
  }
  const fmtTs = (ms?: number, estimated?: boolean) => {
    if (!ms) {
      return '-'
    }
    const label = formatGraphTimestampLocalMinutes(ms, t('lang') as string)
    return estimated ? `≈ ${label}` : label
  }
  const events = React.useMemo(() => {
    if (!proposal) {
      return [] as TimelineEvent[]
    }
    const ev: TimelineEvent[] = []
    const createdMs = normalizeTs(proposal.createdAt)
    if (createdMs) {
      ev.push({
        key: 'created',
        label: `${proposerName || ''} ${t('proposal.events.created')}`,
        ts: createdMs,
        display: formatGraphTimestampLocalMinutes(
          createdMs,
          t('lang') as string,
        ),
        tx: proposal.proposeTx || undefined,
      })
    }
    if (startBlockNum) {
      const ms = startInfo?.timestamp
        ? normalizeTs(startInfo.timestamp)
        : undefined
      ev.push({
        key: 'start',
        label: t('proposal.events.start'),
        ts: ms,
        display: fmtTs(ms, startInfo?.isEstimated),
        block: startBlockNum,
      })
    }
    if (endBlockNum) {
      const ms = endInfo?.timestamp ? normalizeTs(endInfo.timestamp) : undefined
      ev.push({
        key: 'end',
        label: t('proposal.events.end'),
        ts: ms,
        display: fmtTs(ms, endInfo?.isEstimated),
        block: endBlockNum,
      })
    }
    const statusInfo = proposal.status || ''
    const finalized = [
      'succeeded',
      'defeated',
      'canceled',
      'expired',
      'executed',
    ]
    if (finalized.includes(statusInfo)) {
      const ms = endInfo?.timestamp ? normalizeTs(endInfo.timestamp) : undefined
      ev.push({
        key: 'result',
        label: t(`proposalStatus.${statusInfo}`, statusInfo) as string,
        ts: ms,
        display: fmtTs(ms, endInfo?.isEstimated),
      })
    }
    if (proposal.executed) {
      const execMs = normalizeTs(proposal.executeTime)
      ev.push({
        key: 'executed',
        label: t('proposalStatus.executed', 'Executed'),
        ts: execMs,
        display: execMs
          ? formatGraphTimestampLocalMinutes(execMs, t('lang') as string)
          : '-',
        accent: 'executed',
        tx: proposal.executeTx || undefined,
      })
    }
    if (proposal.canceled) {
      const cancelMs = normalizeTs(proposal.cancelTime)
      ev.push({
        key: 'canceled',
        label: t('proposal.events.canceled', '取消'),
        ts: cancelMs,
        display: cancelMs
          ? formatGraphTimestampLocalMinutes(cancelMs, t('lang') as string)
          : '-',
        accent: 'canceled',
        tx: proposal.cancelTx || undefined,
      })
    }
    ;(proposal.voteCasts || []).forEach(v => {
      const voteMs = normalizeTs(v.createdAt)
      ev.push({
        key: `vote-${v.id}`,
        type: 'vote',
        voteAddress: v.voter?.id,
        voteSupport: v.support,
        ts: voteMs,
        display: voteMs
          ? formatGraphTimestampLocalMinutes(voteMs, t('lang') as string)
          : '-',
        tx: v.tx || undefined,
        label: v.voter?.id,
      })
    })
    ev.sort((a, b) => (a.ts && b.ts ? a.ts - b.ts : 0))
    return ev
  }, [
    proposal,
    proposerName,
    startBlockNum,
    endBlockNum,
    startInfo?.timestamp,
    endInfo?.timestamp,
    startInfo?.isEstimated,
    endInfo?.isEstimated,
    t,
  ])
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{t('proposal.timeline')}</h2>
      <div className="relative">
        <div className="absolute left-2 top-3 bottom-3 w-px bg-border" />
        <ul className="flex flex-col-reverse gap-6 pl-0 m-0 list-none">
          {events.map((e, idx) => {
            const safeKey = e.key || `evt-${idx}`
            const isVote = safeKey.startsWith('vote-')
            return (
              <li key={safeKey} className="relative pl-8">
                <span
                  className={`absolute left-0 top-0.5 w-4 h-4 rounded-full border-1 flex items-center justify-center bg-background ${
                    e.accent === 'executed'
                      ? 'border-green-500 text-green-500'
                      : e.accent === 'canceled'
                        ? 'border-red-500 text-red-500'
                        : isVote
                          ? 'border-blue-400 text-blue-400'
                          : safeKey === 'result'
                            ? 'border-blue-500 text-blue-500'
                            : 'border-primary text-primary'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                </span>
                <div className="text-sm font-medium tracking-wide mb-1 text-muted-foreground flex flex-wrap gap-2">
                  {e.type === 'vote' ? (
                    <VoteEventLabel
                      address={e.voteAddress!}
                      support={e.voteSupport!}
                    />
                  ) : (
                    <span>{e.label}</span>
                  )}
                  {e.block && (
                    <span className="font-normal text-secondary">
                      #{e.block}
                    </span>
                  )}
                </div>
                <div className="text-xs leading-snug break-words flex flex-col gap-1">
                  <span>
                    {e.tx ? (
                      <a
                        href={getExplorerTxUrl(e.tx)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline hover:decoration-solid"
                      >
                        {e.display}
                      </a>
                    ) : (
                      e.display
                    )}
                  </span>
                  {isVote && e.label && (
                    <span className="text-[10px] font-mono text-muted-foreground break-all">
                      {(e.label.match(/^(0x[a-fA-F0-9]{4,})/) || [])[1]}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function VoteEventLabel({
  address,
  support,
}: {
  address: string
  support: number
}) {
  const name = useDisplayName({ address })
  const { t } = useTranslation()
  const s =
    support === 1
      ? t('proposal.vote.for')
      : support === 0
        ? t('proposal.vote.against')
        : t('proposal.vote.abstain')
  return (
    <span>
      {`${name || short(address)} ${t('proposal.vote.sectionTitle')} (${s})`}
    </span>
  )
}
