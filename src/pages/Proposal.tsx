import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ProposalResponseData } from '@/graphql'
import { getProposal } from '@/graphql'
import { useTranslation } from 'react-i18next'
import { short, formatRelativeTime } from '@/utils/format'
import { extractBracketCode, buildProposalTitle } from '@/utils/proposal'
import { useProposalState } from '@/hooks/useProposalState'
import ProposalStatusBadge from '@/components/ProposalStatusBadge'
import { getExplorerTxUrl } from '@/config'
import { ROUTES } from '@/constants'
import { useDisplayName } from '@/hooks/useDisplayName'
import { parseProposalActions } from '@/lib/parseProposalActions'
import { useTokenInfo } from '@/hooks/useTokenInfo'
// (Popover moved into extracted components)
import { ProposalDebugPanel } from '@/components/proposal/ProposalDebugPanel'
import { ProposalActions } from '@/components/proposal/ProposalActions'
import { ProposalResults } from '@/components/proposal/ProposalResults'
import { ProposalTimeline } from '@/components/proposal/ProposalTimeline'
import { ProposalVotePanel } from '@/components/proposal/ProposalVotePanel'

export default function Proposal() {
  const { id } = useParams()
  const { t } = useTranslation()
  // Debug flag (?debug=1) to help inspect raw proposal fields when diagnosing discrepancies
  const debug =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === '1'
  const { isLoading, error, data } = useQuery<ProposalResponseData>({
    queryKey: ['proposal', id],
    queryFn: () => getProposal(id!),
    enabled: !!id,
  })

  const proposal = data?.proposal
  const proposerName = useDisplayName({ address: proposal?.proposer?.id })
  const startBlockNum = proposal?.startBlock
    ? Number(proposal.startBlock)
    : undefined
  const endBlockNum = proposal?.endBlock ? Number(proposal.endBlock) : undefined

  const { stateCode } = useProposalState({
    proposalId: proposal?.id || id,
    tx: proposal?.proposeTx,
  })

  // Token info only for parsing action human-readable values
  const { data: tokenInfo } = useTokenInfo()

  // Voting + execution logic moved into ProposalVotePanel to reduce prop surface & duplication.

  // Parse proposal actions for display & derive code / events
  const bracketCode = proposal ? extractBracketCode(proposal.description) : ''
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
  const code = buildProposalTitle(bracketCode, parsedActions, t)

  // Helper: normalize seconds/milliseconds timestamp (string or number)
  // Timeline events are now built inside ProposalTimeline.

  const txUrl = proposal?.proposeTx
    ? getExplorerTxUrl(proposal.proposeTx)
    : undefined

  if (isLoading || !proposal) {
    return (
      <div className="p-6 text-sm">
        {t('proposal.loading', 'Loading proposal…')}
      </div>
    )
  }
  if (error) {
    return (
      <div className="p-6 text-sm text-destructive">
        {t('proposal.error', 'Failed to load')}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Link
          to={ROUTES.HOME}
          className="text-sm text-secondary hover:text-primary"
        >
          ← {t('home.backToProposals')}
        </Link>
      </div>
      <header className="flex flex-col gap-4 border-b pb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-bold break-all">{code}</h1>
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
                    {txUrl ? (
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
                    ) : (
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
                {proposal.description.replace(/\[.*?\]\s*/, '')}
              </p>
            </div>
            {debug && (
              <ProposalDebugPanel
                proposal={proposal}
                stateCode={stateCode ?? null}
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
              stateCode={stateCode ?? null}
            />
            <ProposalResults proposal={proposal} />
            {startBlockNum && endBlockNum && (
              <ProposalTimeline
                proposal={proposal}
                proposerName={proposerName || ''}
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
