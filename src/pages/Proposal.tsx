import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProposal, ProposalResponseData } from '@/graphql'
import { useTranslation } from 'react-i18next'
import {
  short,
  formatGraphTimestampLocalMinutes,
  toScaledNumber,
  formatNumber,
  formatRelativeTime,
} from '@/utils/format'
import { extractBracketCode, buildProposalTitle } from '@/utils/proposal'
import { useProposalState } from '@/hooks/useProposalState'
import ProposalStatusBadge from '@/components/ProposalStatusBadge'
import { getExplorerTxUrl } from '@/config'
import { ROUTES } from '@/constants'
import { useEstimateBlockTimestamp } from '@/hooks/useEstimateBlockTimestamp'
import { useDisplayName } from '@/hooks/useDisplayName'
import { parseProposalActions } from '@/lib/parseProposalActions'
import { useTokenInfo } from '@/hooks/useTokenInfo'
import { formatTokenAmount } from '@/utils/format'
import { useGovernorQuorum } from '@/hooks/useGovernorQuorum'
import { ActionSummary } from '@/components/ActionSummary'
import { MdCheckCircle } from 'react-icons/md'

export default function Proposal() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { isLoading, error, data } = useQuery<ProposalResponseData>({
    queryKey: ['proposal', id],
    queryFn: () => getProposal(id!),
    enabled: !!id,
  })

  const proposal = data?.proposal
  const proposerName = useDisplayName({ address: proposal?.proposer?.id })
  const startBlockNum = proposal?.startBlock ? Number(proposal.startBlock) : undefined
  const endBlockNum = proposal?.endBlock ? Number(proposal.endBlock) : undefined

  const { data: startInfo } = useEstimateBlockTimestamp(startBlockNum)
  const { data: endInfo } = useEstimateBlockTimestamp(endBlockNum)

  const { stateCode } = useProposalState({
    proposalId: proposal?.id || id,
    tx: proposal?.proposeTx,
  })

  // Token info (includes decimals)
  const { data: tokenInfo } = useTokenInfo()

  // Aggregate vote stats
  const voteCasts = proposal?.voteCasts || []
  const snapshotBlock = startBlockNum
  const { data: quorumRaw } = useGovernorQuorum(snapshotBlock)

  const big = (s: string | number) => (typeof s === 'number' ? BigInt(s) : BigInt(s || '0'))
  let forBN = 0n,
    againstBN = 0n,
    abstainBN = 0n
  voteCasts.forEach(v => {
    const w = big(v.weight)
    if (v.support === 0) againstBN += w
    else if (v.support === 1) forBN += w
    else if (v.support === 2) abstainBN += w
  })
  const totalBN = forBN + againstBN + abstainBN
  // Scale by token decimals (fallback 18) -> display whole token units
  const scale = (bn: bigint) => toScaledNumber(bn, tokenInfo?.decimals ?? 18)
  const votes = { for: scale(forBN), against: scale(againstBN), abstain: scale(abstainBN) }
  const totalVotes = scale(totalBN)
  const quorum = quorumRaw ? scale(quorumRaw as bigint) : undefined

  if (isLoading) return <div>{t('common.loading')}</div>
  if (error) return <div>Error: {error instanceof Error ? error.message : 'Unknown error'}</div>
  if (!proposal) return <div>{t('home.backToProposals')}</div>

  const bracketCode = extractBracketCode(proposal.description)
  const parsedActions = parseProposalActions(
    proposal.targets || [],
    proposal.calldatas || [],
    proposal.signatures || [],
    tokenInfo?.decimals,
    tokenInfo?.symbol
  )
  const code = buildProposalTitle(bracketCode, parsedActions, t)
  const txUrl = getExplorerTxUrl(proposal.proposeTx)

  const fmt = (unixSec?: number, estimated?: boolean) => {
    if (!unixSec) return '-'
    const label = formatGraphTimestampLocalMinutes(unixSec * 1000, t('lang') as string)
    return estimated ? `≈ ${label}` : label
  }

  // Build chronological events list (oldest -> newest)
  type TimelineEvent = {
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
  const events: TimelineEvent[] = []

  // Action labels (Chinese)
  const L = {
    created: '创建提案',
    start: '开始投票',
    end: '结束投票',
    executed: '执行',
    canceled: '取消',
  }

  // Created (proposal.createdAt is assumed seconds or ms; detect length)
  const createdDate = proposal.createdAt
  const createdTs =
    typeof createdDate === 'string' && createdDate.length <= 10
      ? Number(createdDate)
      : Number(createdDate) / (createdDate && createdDate.toString().length <= 10 ? 1 : 1000)
  events.push({
    key: 'created',
    label: proposerName + ' ' + L.created,
    ts: createdTs,
    display: formatGraphTimestampLocalMinutes(proposal.createdAt, t('lang') as string),
    tx: proposal.proposeTx || undefined,
  })
  if (startBlockNum) {
    events.push({
      key: 'start',
      label: L.start,
      ts: startInfo?.timestamp,
      display: fmt(startInfo?.timestamp, startInfo?.isEstimated),
      block: startBlockNum,
    })
  }
  if (endBlockNum) {
    events.push({
      key: 'end',
      label: L.end,
      ts: endInfo?.timestamp,
      display: fmt(endInfo?.timestamp, endInfo?.isEstimated),
      block: endBlockNum,
    })
  }
  const statusInfo = proposal.status || ''
  const finalizedStatuses = ['succeeded', 'defeated', 'canceled', 'expired', 'executed']
  if (finalizedStatuses.includes(statusInfo)) {
    // Result time = end block time (exact or estimated)
    events.push({
      key: 'result',
      label: t(`proposalStatus.${statusInfo}`, statusInfo),
      ts: endInfo?.timestamp,
      display: fmt(endInfo?.timestamp, endInfo?.isEstimated),
    })
  }
  if (proposal.executed) {
    const execTime = proposal.executeTime
    const execTs = execTime
      ? execTime.toString().length <= 10
        ? Number(execTime)
        : Number(execTime) / 1000
      : undefined
    events.push({
      key: 'executed',
      label: t('proposalStatus.executed', 'Executed'),
      ts: execTs,
      display: execTs ? formatGraphTimestampLocalMinutes(execTs * 1000, t('lang') as string) : '-',
      accent: 'executed',
      tx: proposal.executeTx || undefined,
    })
  }
  if (proposal.canceled) {
    const cancelTsRaw = proposal.cancelTime
    const cancelTs = cancelTsRaw
      ? cancelTsRaw.toString().length <= 10
        ? Number(cancelTsRaw)
        : Number(cancelTsRaw) / 1000
      : undefined
    events.push({
      key: 'canceled',
      label: L.canceled,
      ts: cancelTs,
      display: cancelTs
        ? formatGraphTimestampLocalMinutes(cancelTs * 1000, t('lang') as string)
        : '-',
      accent: 'canceled',
      tx: proposal.cancelTx || undefined,
    })
  }

  // Insert vote cast events
  voteCasts.forEach(v => {
    const ts = v.createdAt.length <= 10 ? Number(v.createdAt) : Number(v.createdAt) / 1000
    events.push({
      key: `vote-${v.id}`,
      type: 'vote',
      voteAddress: v.voter.id,
      voteSupport: v.support,
      ts,
      display: formatGraphTimestampLocalMinutes(ts * 1000, t('lang') as string),
      tx: v.tx,
    })
  })

  // Ensure chronological order by timestamp (fallback to original order if missing)
  events.sort((a, b) => (a.ts && b.ts ? a.ts - b.ts : 0))

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Link to={ROUTES.HOME} className="text-sm text-muted-foreground hover:text-primary">
          ← {t('home.backToProposals')}
        </Link>
      </div>
      <header className="flex flex-col gap-4 border-b pb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-bold break-all">{code}</h1>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <ProposalStatusBadge
            className="!text-sm !py-2 !px-3"
            proposal={proposal}
            numericCode={stateCode ?? null}
          />
        </div>
      </header>
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-start md:gap-8">
          <div className="md:w-2/3 space-y-8 mb-8 md:mb-0">
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">{t('proposal.proposer')}</h2>
              {proposal?.proposer?.id && (
                <p className="text-secondary flex items-center gap-1">
                  <span className="font-medium" title={proposal.proposer.id}>
                    {proposerName || short(proposal.proposer.id)}
                  </span>
                  {t('proposal.createdAt')}
                  <span>
                    {txUrl ? (
                      <a
                        href={txUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {formatRelativeTime(proposal.createdAt, t('lang') as string)}
                      </a>
                    ) : (
                      formatRelativeTime(proposal.createdAt, t('lang') as string)
                    )}
                  </span>
                </p>
              )}
            </section>
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">{t('proposal.description')}</h2>
              <p className="leading-loose whitespace-pre-wrap break-words">
                {proposal.description.replace(/\[.*?\]\s*/, '')}
              </p>
            </section>
            <section>
              {parsedActions.length > 0 && (
                <div className="mt-4 space-y-4">
                  <h3 className="text-lg font-semibold">执行操作</h3>
                  <ul className="space-y-2 text-sm">
                    {parsedActions.map((a, i) => {
                      const isBatch =
                        a.type === 'batchMint' && a.recipients && a.recipients.length > 0
                      const fullBatchCall = isBatch
                        ? `${a.functionName}([${a.recipients!.map(r => `"${r.address}"`).join(', ')}], [${a.recipients!.map(r => r.amount.toString()).join(', ')}])`
                        : ''
                      return (
                        <li
                          key={i}
                          className="p-4 flex flex-col gap-2 border rounded-md bg-muted/30"
                        >
                          <div className="font-medium flex flex-wrap gap-2 items-center">
                            <ActionSummary action={a} />
                            {a.type === 'governorSetting' && a.rawValue !== undefined && (
                              <span className="text-[10px] px-1 py-0.5 rounded bg-background border font-mono opacity-80">
                                raw: {a.rawValue.toString()}
                              </span>
                            )}
                          </div>
                          {!isBatch && (
                            <div className="text-xs text-secondary break-all mb-1">
                              {a.functionName}(
                              {a.args
                                .map(x =>
                                  typeof x === 'bigint'
                                    ? x.toString()
                                    : Array.isArray(x)
                                      ? `[${x.length}]`
                                      : x
                                )
                                .join(', ')}
                              )
                            </div>
                          )}
                          {isBatch && (
                            <div className="overflow-auto mt-2 space-y-2">
                              <table className="min-w-full text-xs border rounded">
                                <thead>
                                  <tr className="bg-muted/40 text-left">
                                    <th className="px-2 py-1 font-medium">Recipient</th>
                                    <th className="px-2 py-1 font-medium">Address</th>
                                    <th className="px-2 py-1 font-medium text-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {a.recipients!.map(r => (
                                    <BatchRecipientRow
                                      key={r.address + r.amount.toString()}
                                      address={r.address}
                                      amount={r.amount}
                                      decimals={tokenInfo?.decimals ?? 18}
                                      symbol={tokenInfo?.symbol}
                                    />
                                  ))}
                                </tbody>
                              </table>
                              <div className="text-xs opacity-70 break-all font-mono">
                                {fullBatchCall}
                              </div>
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </section>
          </div>
          <div className="md:w-1/3 w-full space-y-6">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center justify-between">
                <span>Results</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {formatNumber(totalVotes)} votes
                </span>
              </h2>
              <div className="p-4 border rounded-md bg-background/50 flex flex-col gap-4">
                <div className="h-4 w-full bg-muted rounded-full overflow-hidden flex relative">
                  {(['for', 'against', 'abstain'] as const).map(k => {
                    const val = votes[k]
                    const pct = totalVotes ? (val / totalVotes) * 100 : 0
                    const color =
                      k === 'for'
                        ? 'bg-blue-500'
                        : k === 'against'
                          ? 'bg-purple-600'
                          : 'bg-green-500'
                    return (
                      <div
                        key={k}
                        style={{ width: pct + '%' }}
                        className={color + ' transition-all'}
                      />
                    )
                  })}
                  {quorum !== undefined && totalVotes > 0 && (
                    <span
                      className="absolute top-0 bottom-0 w-0.5 bg-yellow-400"
                      style={{ left: `${Math.min(100, (quorum / totalVotes) * 100)}%` }}
                    />
                  )}
                </div>
                {quorum !== undefined && (
                  <div className="text-muted-foreground flex flex-col justify-between">
                    <div className="flex flex-row justify-between items-center">
                      <div className="flex items-center gap-2">
                        <MdCheckCircle className="text-primary w-4 h-4" />
                        For
                      </div>
                      <span>{formatNumber(votes.for, 1)}</span>
                    </div>
                    <div className="flex flex-row justify-between items-center">
                      <div className="flex items-center gap-2">
                        <MdCheckCircle className="text-destructive w-4 h-4" />
                        Against
                      </div>
                      <span>{formatNumber(votes.against, 1)}</span>
                    </div>
                    <div className="flex flex-row justify-between">
                      <div>Quorum</div>
                      <span>{formatNumber(quorum, 1)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Timeline</h2>
              <div className="relative">
                <div className="absolute left-2 top-3 bottom-3 w-px bg-border" />
                <ul className="flex flex-col-reverse gap-6 pl-0 m-0 list-none">
                  {events.map(e => (
                    <li key={e.key} className="relative pl-8">
                      <span
                        className={
                          'absolute left-0 top-0.5 w-4 h-4 rounded-full border-1 flex items-center justify-center bg-background ' +
                          (e.accent === 'executed'
                            ? 'border-green-500 text-green-500'
                            : e.accent === 'canceled'
                              ? 'border-red-500 text-red-500'
                              : e.key.startsWith('vote-')
                                ? 'border-blue-400 text-blue-400'
                                : e.key === 'result'
                                  ? 'border-blue-500 text-blue-500'
                                  : 'border-primary text-primary')
                        }
                      >
                        <span className="w-2 h-2 rounded-full bg-current" />
                      </span>
                      <div className="text-sm font-medium tracking-wide uppercase mb-1 text-muted-foreground flex flex-wrap gap-2">
                        {e.type === 'vote' ? (
                          <VoteEventLabel address={e.voteAddress!} support={e.voteSupport!} />
                        ) : (
                          <span>{e.label}</span>
                        )}
                        {e.block && <span className="font-normal text-secondary">#{e.block}</span>}
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
                        {e.key.startsWith('vote-') && e.label && (
                          <span className="text-[10px] font-mono text-muted-foreground break-all">
                            {(e.label.match(/^(0x[a-fA-F0-9]{4,})/) || [])[1]}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function VoteEventLabel({ address, support }: { address: string; support: number }) {
  const name = useDisplayName({ address })
  const s = support === 1 ? '赞成' : support === 0 ? '反对' : '弃权'
  return <span>{(name || short(address)) + ' 投票 (' + s + ')'}</span>
}

function BatchRecipientRow({
  address,
  amount,
  decimals,
  symbol,
}: {
  address: string
  amount: bigint
  decimals: number
  symbol?: string
}) {
  const name = useDisplayName({ address })
  return (
    <tr className="border-t last:border-b align-top">
      <td className="px-2 py-1 whitespace-nowrap font-mono">{name || short(address)}</td>
      <td className="px-2 py-1 font-mono break-all max-w-[160px]">{address}</td>
      <td className="px-2 py-1 text-right">
        {formatTokenAmount(amount, decimals)} {symbol || ''}
      </td>
    </tr>
  )
}
