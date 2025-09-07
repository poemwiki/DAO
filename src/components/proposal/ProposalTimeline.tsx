import type { Proposal } from '@/types'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { IoMdTime } from 'react-icons/io'
import { getExplorerTxUrl } from '@/config'
import { ROUTES } from '@/constants'
import { Avatar } from '@/components/ui/Avatar'
import { useDisplayName } from '@/hooks/useDisplayName'
import { useEstimateBlockTimestamp } from '@/hooks/useEstimateBlockTimestamp'
import { formatGraphTimestampLocalMinutes, short } from '@/utils/format'

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

  // WHY: Original implementation relied on sorting by (possibly undefined) timestamps, then
  // updating when async block timestamp estimates arrived — causing order flicker.
  // We want a deterministic visual order from first paint. Strategy:
  // 1. Use a fixed priority sequence independent of async timestamps.
  // 2. Only order votes among themselves (their timestamps are already concrete from subgraph).
  // 3. Do not re-sort structural events when estimates resolve; only their display text changes.
  // Visual top -> bottom (descending lifecycle):
  //   executed|canceled (terminal) > end/result (future or finished) > votes (newest->oldest) > start > created
  const events = React.useMemo(() => {
    if (!proposal)
      return [] as TimelineEvent[]
    const list: TimelineEvent[] = []

    const createdMs = normalizeTs(proposal.createdAt)
    const createdEvent: TimelineEvent | null = createdMs
      ? {
          key: 'created',
          label: `${proposerName || ''} ${t('proposal.events.created')}`,
          ts: createdMs,
          display: formatGraphTimestampLocalMinutes(createdMs, t('lang') as string),
          tx: proposal.proposeTx || undefined,
        }
      : null

    const startMs = startInfo?.timestamp ? normalizeTs(startInfo.timestamp) : undefined
    const startEvent: TimelineEvent | null = startBlockNum
      ? {
          key: 'start',
          label: t('proposal.events.start'),
          ts: startMs,
          display: fmtTs(startMs, startInfo?.isEstimated),
          block: startBlockNum,
        }
      : null

    const endMs = endInfo?.timestamp ? normalizeTs(endInfo.timestamp) : undefined
    const endEvent: TimelineEvent | null = endBlockNum
      ? {
          key: 'end',
          label: t('proposal.events.end'),
          ts: endMs,
          display: fmtTs(endMs, endInfo?.isEstimated),
          block: endBlockNum,
        }
      : null

    const statusInfo = proposal.status || ''
    const finalized = ['succeeded', 'defeated', 'canceled', 'expired', 'executed']
    const resultEvent: TimelineEvent | null = finalized.includes(statusInfo)
      ? {
          key: 'result',
          label: t(`proposalStatus.${statusInfo}`, statusInfo) as string,
          ts: endMs,
          display: fmtTs(endMs, endInfo?.isEstimated),
        }
      : null

    const executedEvent: TimelineEvent | null = proposal.executed
      ? (() => {
          const execMs = normalizeTs(proposal.executeTime)
          return {
            key: 'executed',
            label: t('proposalStatus.executed', 'Executed'),
            ts: execMs,
            display: execMs
              ? formatGraphTimestampLocalMinutes(execMs, t('lang') as string)
              : '-',
            accent: 'executed',
            tx: proposal.executeTx || undefined,
          }
        })()
      : null

    const canceledEvent: TimelineEvent | null = proposal.canceled
      ? (() => {
          const cancelMs = normalizeTs(proposal.cancelTime)
          return {
            key: 'canceled',
            label: t('proposal.events.canceled', '取消'),
            ts: cancelMs,
            display: cancelMs
              ? formatGraphTimestampLocalMinutes(cancelMs, t('lang') as string)
              : '-',
            accent: 'canceled',
            tx: proposal.cancelTx || undefined,
          }
        })()
      : null

    // Votes sorted newest -> oldest to sit immediately under end/result cluster
    const voteEvents: TimelineEvent[] = (proposal.voteCasts || [])
      .map((v) => {
        const voteMs = normalizeTs(v.createdAt)
        return {
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
        } as TimelineEvent
      })
      .sort((a, b) => (b.ts || 0) - (a.ts || 0))

    // Assemble in fixed visual order (top -> bottom)
    if (executedEvent)
      list.push(executedEvent)
    if (canceledEvent)
      list.push(canceledEvent)
    if (endEvent)
      list.push(endEvent)
    if (resultEvent)
      list.push(resultEvent)
    list.push(...voteEvents)
    if (startEvent)
      list.push(startEvent)
    if (createdEvent)
      list.push(createdEvent)

    return list
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
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <IoMdTime />
        {t('proposal.timeline')}
      </h2>
      <div className="relative">
        <div className="absolute left-2 top-3 bottom-3 w-px bg-border" />
        {(() => {
          const now = Date.now()
          const lastCompletedIdx = events
            .map((e, i) => ({ i, ts: e.ts }))
            .filter(x => typeof x.ts === 'number' && (x.ts as number) <= now)
            .at(-1)
            ?.i
          return (
            <ul className="flex flex-col gap-6 pl-0 m-0 list-none">
              {events.map((e, idx) => {
                const safeKey = e.key || `evt-${idx}`
                const isCompleted = typeof e.ts === 'number' && e.ts <= now
                const isCurrent = isCompleted && lastCompletedIdx === idx

                // Dot styles
                const baseOuter = 'absolute left-0 top-0.5 w-4 h-4 rounded-full flex items-center justify-center'
                const futureOuter = 'border border-muted bg-background'
                const currentOuter = 'border-2 border-primary bg-background'
                const completedOuter = 'bg-primary text-background'
                const outerClass = isCompleted
                  ? completedOuter
                  : isCurrent
                    ? currentOuter
                    : futureOuter

                return (
                  <li key={safeKey} className="relative pl-8">
                    <span className={`${baseOuter} ${outerClass}`}>
                      {isCompleted ? (
                        // check icon for completed
                        <svg
                          viewBox="0 0 16 16"
                          width="10"
                          height="10"
                          aria-hidden="true"
                          className="fill-current"
                        >
                          <path d="M6.173 12.414a1 1 0 0 1-1.414 0L2.293 9.95a1 1 0 1 1 1.414-1.415l1.759 1.76 6.12-6.12a1 1 0 1 1 1.415 1.414l-7.828 7.826Z" />
                        </svg>
                      ) : isCurrent
                        ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                          )
                        : (
                            <span className="w-2.5 h-2.5 rounded-full bg-transparent" />
                          )}
                    </span>
                    <div className="text-sm font-medium tracking-wide mb-1 flex flex-wrap gap-2">
                      {e.type === 'vote'
                        ? (
                            <VoteEventLabel
                              address={e.voteAddress!}
                            />
                          )
                        : (
                            <span>{e.label}</span>
                          )}
                      {e.block && (
                        <span className="font-normal text-secondary">
                          #
                          {e.block}
                        </span>
                      )}
                    </div>
                    <div className="text-xs leading-snug break-words flex flex-col gap-1">
                      <span>
                        {e.tx
                          ? (
                              <a
                                href={getExplorerTxUrl(e.tx)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-secondary hover:underline hover:decoration-solid"
                              >
                                {e.display}
                              </a>
                            )
                          : (
                              e.display
                            )}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )
        })()}
      </div>
    </div>
  )
}

function VoteEventLabel({
  address,
}: {
  address: string
}) {
  const name = useDisplayName({ address })
  const { t } = useTranslation()
  
  return (
    <span className="flex items-center gap-2">
      <Avatar address={address} size={16} />
      <Link
        to={ROUTES.MEMBER.replace(':address', address)}
        className="text-primary hover:underline"
      >
        {name || short(address)}
      </Link>
      <span>{` ${t('proposal.vote.sectionTitle')}`}</span>
    </span>
  )
}
