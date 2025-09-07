import type { Proposal } from '@/types'
import type { GovernorStateCode } from '@/utils/governor'
import { useQueryClient } from '@tanstack/react-query'
import { useConnectWallet } from '@web3-onboard/react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { MdAdsClick, MdCheck, MdCheckBoxOutlineBlank, MdClear, MdOutlineRocketLaunch } from 'react-icons/md'
import { getExplorerTxUrl } from '@/config'
import { useCastVote } from '@/hooks/useCastVote'
import { useExecuteProposal } from '@/hooks/useExecuteProposal'
import { useIsDelegated } from '@/hooks/useIsDelegated'
import { short } from '@/utils/format'
import { Button } from '../ui/button'

// WHY: This panel previously accepted many derived props (canExecute, executing, hasVoted, etc.)
// which tightly coupled the page to voting logic. We internalize the hooks + derivations here,
// exposing only what the component truly needs: the proposal + its current numeric state code.
// This keeps Proposal.tsx thinner and localizes vote/execute side‑effect orchestration.

export interface ProposalVotePanelProps {
  proposal: Proposal
  stateCode: GovernorStateCode | null
}

export function ProposalVotePanel({
  proposal,
  stateCode,
}: ProposalVotePanelProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [{ wallet }] = useConnectWallet()
  const voterAddress = wallet?.accounts?.[0]?.address?.toLowerCase()
  const voteCasts = proposal?.voteCasts || []
  const hasVoted = voterAddress
    ? voteCasts.some(v => v.voter?.id?.toLowerCase() === voterAddress)
    : false
  const { isDelegated } = useIsDelegated()
  const hasVotingPower = isDelegated // self or delegated balance

  const canVote = stateCode === 1 // Active
  const canExecute = !proposal?.executed && (stateCode === 4 || stateCode === 5)
  const isExecuted = !!proposal?.executed

  const {
    cast,
    status: castStatus,
    error: castError,
    result: castResult,
  } = useCastVote({
    onSuccess: () => {
      if (proposal?.id) {
        queryClient.invalidateQueries({ queryKey: ['proposal', proposal.id] })
        queryClient.invalidateQueries({ queryKey: ['proposalState', proposal.id] })
      }
    },
  })

  // Post-vote polling to mitigate subgraph lag (same behavior as earlier page implementation)
  React.useEffect(() => {
    let attempts = 0
    let timer: ReturnType<typeof setTimeout>
    if (castStatus === 'success' && proposal?.id) {
      const poll = () => {
        attempts++
        queryClient.invalidateQueries({ queryKey: ['proposal', proposal.id] })
        if (attempts < 5) {
          timer = setTimeout(poll, 3000)
        }
      }
      timer = setTimeout(poll, 2500)
    }
    return () => timer && clearTimeout(timer)
  }, [castStatus, proposal?.id, queryClient])

  const {
    execute,
    status: execStatus,
    error: execError,
  // txHash removed (panel unmounts on success)
  } = useExecuteProposal({
    onSuccess: () => {
      if (proposal?.id) {
        queryClient.invalidateQueries({ queryKey: ['proposal', proposal.id] })
        queryClient.invalidateQueries({ queryKey: ['proposalState', proposal.id] })
      }
    },
  })

  const executing
    = execStatus === 'building'
      || execStatus === 'signing'
      || execStatus === 'pending'
  const justExecuted = execStatus === 'success'
  // Hide panel once voting period is over (stateCode !== 1) or executed
  if (isExecuted || justExecuted || stateCode !== 1) {
    return null
  }
  const voteDisabled
    = !canVote
      || hasVoted
      || castStatus === 'pending'
      || castStatus === 'signing'
      || !hasVotingPower

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center justify-start gap-2">
        <MdAdsClick />
        <span>{t('proposal.vote.sectionTitle')}</span>
      </h2>
      <div className="p-4 border rounded-md bg-background/50 flex flex-col gap-3">
        {canExecute ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm">
              {t('proposal.execute.description', 'Execute this proposal')}
            </p>
            <Button
              type="button"
              disabled={executing}
              onClick={() =>
                execute(
                  proposal.id,
                  (proposal.targets || []) as `0x${string}`[],
                  (proposal.values || []).map(v => BigInt(v)),
                  (proposal.calldatas || []) as `0x${string}`[],
                  proposal.description,
                )}
            >
              <MdOutlineRocketLaunch />
              {executing
                ? t('proposal.execute.pending', 'Executing…')
                : t('proposal.execute.button', 'Execute Proposal')}
            </Button>
            {execStatus === 'signing' && (
              <p className="text-xs text-muted-foreground">
                {t('proposal.execute.signing', 'Please sign in wallet…')}
              </p>
            )}
            {execStatus === 'pending' && (
              <p className="text-xs text-muted-foreground">
                {t('proposal.execute.pending', 'Executing…')}
              </p>
            )}
            {/* Success state removed because panel unmounts when justExecuted */}
            {execStatus === 'error' && execError
              ? (
                  <p className="text-xs text-destructive break-words">
                    {t('proposal.execute.error', 'Execution failed')}
                    :
                    {' '}
                    {String(
                      (execError as any)?.shortMessage
                      || (execError as any)?.message
                      || (execError as any),
                    )}
                  </p>
                )
              : null}
          </div>
        ) : (
          <>
            <div className="flex gap-3">
              <Button
                type="button"
                disabled={voteDisabled}
                onClick={() => cast(proposal.id, 1)}
                className="flex-1 text-sm px-3 py-2 rounded border bg-primary text-primary-foreground disabled:opacity-50"
              >
                <MdCheck />
                {t('proposal.vote.for')}
              </Button>
              <Button
                type="button"
                disabled={voteDisabled}
                onClick={() => cast(proposal.id, 0)}
                className="flex-1 text-sm px-3 py-2 rounded border bg-destructive text-destructive-foreground disabled:opacity-50"
              >
                <MdClear />
                {t('proposal.vote.against')}
              </Button>
              <Button
                type="button"
                disabled={voteDisabled}
                onClick={() => cast(proposal.id, 2)}
                className="flex-1 text-sm px-3 py-2 rounded border bg-yellow-500 text-primary-foreground disabled:opacity-50"
              >
                <MdCheckBoxOutlineBlank />
                {t('proposal.vote.abstain')}
              </Button>
            </div>
            {hasVoted && (
              <p className="text-xs text-muted-foreground">
                {t('proposal.vote.alreadyVoted')}
              </p>
            )}
            {!hasVoted && !canVote && (
              <p className="text-xs text-muted-foreground">
                {t('proposal.vote.cannotVote')}
              </p>
            )}
            {!hasVoted && canVote && !hasVotingPower && (
              <p className="text-xs text-muted-foreground">
                {t('proposal.vote.needVotingPower', '需要投票权才可以投票')}
              </p>
            )}
            {castStatus === 'signing' && (
              <p className="text-xs text-muted-foreground">
                {t('proposal.vote.signing')}
              </p>
            )}
            {castStatus === 'pending' && (
              <p className="text-xs text-muted-foreground">
                {t('proposal.vote.pending')}
              </p>
            )}
            {castStatus === 'success' && castResult?.txHash && (
              <div className="text-xs break-all space-y-1">
                <p>
                  {t('proposal.vote.success')}
                  {' '}
                  <a
                    href={getExplorerTxUrl(castResult.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    {short(castResult.txHash)}
                  </a>
                </p>
                {!hasVoted && (
                  <p className="text-xs text-muted-foreground">
                    {t('proposal.vote.syncing')}
                  </p>
                )}
              </div>
            )}
            {castError
              ? (
                  <p className="text-xs text-destructive break-words">
                    {((): string => {
                      const raw: string
                        = (castError as any)?.shortMessage
                          || (castError as any)?.message
                          || String(castError)
                      return raw.replace(
                        /0x[0-9a-fA-F]{120,}/g,
                        (m: string) => `${m.slice(0, 20)}…`,
                      )
                    })()}
                  </p>
                )
              : null}
          </>
        )}
      </div>
    </div>
  )
}
