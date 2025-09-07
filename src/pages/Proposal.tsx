import type { ProposalResponseData } from '@/graphql'
import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { ProposalActions } from '@/components/proposal/ProposalActions'
// (Popover moved into extracted components)
import { ProposalDebugPanel } from '@/components/proposal/ProposalDebugPanel'
import { ProposalResults } from '@/components/proposal/ProposalResults'
import { ProposalTimeline } from '@/components/proposal/ProposalTimeline'
import { ProposalVotePanel } from '@/components/proposal/ProposalVotePanel'
import ProposalStatusBadge from '@/components/ProposalStatusBadge'
import { Button } from '@/components/ui/button'
import { ProposalPageSkeleton } from '@/components/ui/Skeleton'
import { getExplorerTxUrl } from '@/config'
import { ROUTES } from '@/constants'
import { getProposal } from '@/graphql'
import { useDisplayName } from '@/hooks/useDisplayName'
import { useProposalState } from '@/hooks/useProposalState'
import { useTokenInfo } from '@/hooks/useTokenInfo'
import { formatRelativeTime, short } from '@/utils/format'
import { parseProposalActions } from '@/utils/parseProposalActions'
import { buildProposalTitle, getDisplayDescription } from '@/utils/proposal'

export default function Proposal() {
  const { id } = useParams()
  const { t } = useTranslation()
  // Debug flag (?debug=1) to help inspect raw proposal fields when diagnosing discrepancies
  const debug
    = typeof window !== 'undefined'
      && new URLSearchParams(window.location.search).get('debug') === '1'
  // Progressive loading: first attempt subgraph; if missing, perform limited retries
  const MAX_RETRIES = 3
  const retryDelays = [3000, 5000, 8000] // ms sequence
  const [attempt, setAttempt] = React.useState(0)
  const [manualTick, setManualTick] = React.useState(0)

  const { isLoading, error, data, refetch } = useQuery<ProposalResponseData>({
    queryKey: ['proposal', id, attempt, manualTick],
    queryFn: () => getProposal(id!),
    enabled: !!id,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  const proposal = data?.proposal

  // Trigger timed retries only while no subgraph data
  React.useEffect(() => {
    if (isLoading || proposal || attempt >= MAX_RETRIES)
      return
    const delay = retryDelays[attempt] ?? 0
    if (!delay)
      return
    const handle = setTimeout(() => {
      setAttempt(a => a + 1)
      refetch()
    }, delay)
    return () => clearTimeout(handle)
  }, [isLoading, proposal, attempt])

  // Probe existence & state directly from chain. We intentionally DO NOT depend on tx hashes.
  // Explicit refresh after lifecycle transitions is handled by a manual tick (see below hook usage in action panels).
  const { stateCode: probeStateCode, loading: probeLoading, error: probeError } = useProposalState({
    proposalId: proposal?.id || id,
  })

  const existsOnChain = probeStateCode !== null
  // proposer name (stable even while indexing)
  const proposerName = useDisplayName({ address: proposal?.proposer?.id || '' })
  const startBlockNum = proposal?.startBlock
    ? Number(proposal.startBlock)
    : undefined
  const endBlockNum = proposal?.endBlock ? Number(proposal.endBlock) : undefined

  // Use canonical state hook (same call as probe; avoid double call by reusing probeStateCode)
  const stateCode = probeStateCode

  // Token info only for parsing action human-readable values
  const { data: tokenInfo } = useTokenInfo()

  // Voting + execution logic moved into ProposalVotePanel to reduce prop surface & duplication.

  // Parse proposal actions for display & derive code / events
  const parsedActions = React.useMemo(
    () =>
      proposal
        ? parseProposalActions(
            proposal.targets || [],
            proposal.calldatas || [],
            proposal.signatures || [],
            tokenInfo?.decimals,
            tokenInfo?.symbol,
          )
        : [],
    [proposal, tokenInfo?.decimals, tokenInfo?.symbol],
  )
  // Build title code (includes bracket code + action context)
  const displayTitle = buildProposalTitle(
    proposal?.description,
    parsedActions,
    t,
  )
  const displayDescription = getDisplayDescription(proposal?.description)

  // Helper: normalize seconds/milliseconds timestamp (string or number)
  // Timeline events are now built inside ProposalTimeline.

  const txUrl = proposal?.proposeTx
    ? getExplorerTxUrl(proposal.proposeTx)
    : undefined

  const showSkeleton = isLoading && !proposal && attempt === 0

  // 1) 404: chain probing finished and proposal does NOT exist on-chain
  if (!showSkeleton && !proposal && !probeLoading && !existsOnChain) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 px-6">
        <h1 className="text-4xl font-bold tracking-tight">404</h1>
        <p className="text-sm text-secondary max-w-md">{t('proposal.indexing.notFound')}</p>
        <Button
          onClick={() => {
            setManualTick(tk => tk + 1)
            refetch()
          }}
        >
          {t('proposal.indexing.manualRefresh')}
        </Button>
      </div>
    )
  }

  // 2) Skeleton: initial primary load (first attempt)
  if (showSkeleton) {
    return <ProposalPageSkeleton />
  }

  // 3) Indexing: on-chain exists (or probing) but subgraph data absent / still probing
  if (!proposal) {
    const autoRetryRemaining = attempt < MAX_RETRIES
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 px-6 text-sm">
        <p className="text-secondary">{t('proposal.indexing.probingChain')}</p>
        {existsOnChain && (
          <p className="text-secondary">
            {t('proposal.indexing.onChainFound')}
            {!autoRetryRemaining && ` ${t('proposal.indexing.finalFail')}`}
          </p>
        )}
        <div className="flex gap-3 items-center">
          <Button
            onClick={() => {
              setManualTick(tk => tk + 1)
              refetch()
            }}
          >
            {t('proposal.indexing.manualRefresh')}
          </Button>
          {error && (
            <span className="text-destructive text-xs">
              {t('proposal.error', 'Failed to load')}
            </span>
          )}
        </div>
        {existsOnChain && (
          <p className="text-xs text-secondary">
            State code:
            {probeStateCode}
          </p>
        )}
        {probeError && (
          <p className="text-xs text-destructive">{probeError.message}</p>
        )}
      </div>
    )
  }

  // 4) Main: proposal guaranteed to be present below this point

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Link
          to={ROUTES.HOME}
          className="text-sm text-secondary hover:text-primary"
        >
          ←
          {' '}
          {t('home.backToProposals')}
        </Link>
      </div>
      <header className="flex flex-col gap-4 border-b pb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-bold break-all">{displayTitle}</h1>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className={stateCode === null ? 'invisible' : 'visible'}>
            <ProposalStatusBadge
              className="!text-sm !py-2 !px-3"
              proposal={proposal}
              numericCode={stateCode ?? null}
            />
          </span>
        </div>
      </header>
      <section className="space-y-8 break-all">
        <div className="flex flex-col md:flex-row md:items-start md:gap-8">
          <div className="md:w-2/3 space-y-8 mb-8 md:mb-0">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {t('proposal.proposer')}
              </h2>
              {proposal?.proposer?.id && (
                <p className="text-secondary flex items-center gap-1">
                  <span className="font-medium" title={proposal.proposer.id}>
                    {proposerName || short(proposal.proposer.id)}
                  </span>
                  {t('proposal.createdAt')}
                  <span>
                    {txUrl
                      ? (
                          <a
                            href={txUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {formatRelativeTime(
                              proposal.createdAt,
                              t('lang') as string,
                            )}
                          </a>
                        )
                      : (
                          formatRelativeTime(
                            proposal.createdAt,
                            t('lang') as string,
                          )
                        )}
                  </span>
                </p>
              )}
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {t('proposal.description')}
              </h2>
              <p className="leading-loose whitespace-pre-wrap break-words">
                {displayDescription}
              </p>
            </div>
            {debug && (
              <ProposalDebugPanel
                proposal={proposal}
                stateCode={stateCode}
              />
            )}
            <ProposalActions
              actions={parsedActions}
              tokenDecimals={tokenInfo?.decimals ?? 18}
              tokenSymbol={tokenInfo?.symbol}
              title={t('proposal.actions')}
            />
          </div>
          <div className="md:w-1/3 w-full space-y-6">
            <ProposalVotePanel
              proposal={proposal}
              stateCode={stateCode}
            />
            <ProposalResults proposal={proposal} />
            {startBlockNum && endBlockNum && (
              <ProposalTimeline
                proposal={proposal}
                proposerName={proposerName}
                startBlockNum={startBlockNum}
                endBlockNum={endBlockNum}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
