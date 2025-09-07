import type { ProposalsResponseData } from '@/graphql'
import type { Proposal } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { useConnectWallet } from '@web3-onboard/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaPlus } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import DelegateModal from '@/components/DelegateModal'
// status badge handled inside ProposalListItem
import ProposalListItem from '@/components/ProposalListItem'
import TokenHoldersList from '@/components/TokenHoldersList'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover'
import { ProposalListSkeleton, StatsSkeleton } from '@/components/ui/Skeleton'
import { config } from '@/config'
import { ROUTES } from '@/constants'
import { getAverageBlockTime } from '@/constants/blockTimes'
import { getProposals } from '@/graphql'
import { useGovernorParams } from '@/hooks/useGovernorParams'
import { useIsDelegated } from '@/hooks/useIsDelegated'
import { useProposalStates } from '@/hooks/useProposalStates'
import { useTokenInfo } from '@/hooks/useTokenInfo'
import { cn, estimateDurationFromBlocks, formatTokenAmount } from '@/utils/format'

export default function Home() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isMember, isDelegated } = useIsDelegated()
  const [{ wallet }] = useConnectWallet()
  const [delegateModalOpen, setDelegateModalOpen] = useState(false)
  const [postDelegateNavigate, setPostDelegateNavigate] = useState<
    string | null
  >(null)
  const { isLoading, error, data } = useQuery<ProposalsResponseData>({
    queryKey: ['proposals'],
    queryFn: getProposals,
  })
  const proposals = data?.proposals || []
  const { statuses } = useProposalStates(proposals)
  const { data: govParams } = useGovernorParams()
  const { data: tokenInfo } = useTokenInfo()

  // Calculate correct statistics based on actual status
  const getProposalStats = () => {
    let activeCount = 0
    // let closedCount = 0

    proposals.forEach((proposal: Proposal) => {
      const statusData = statuses[proposal.id]
      // Get the most accurate status: from blockchain > from proposal object > derived
      const actualStatus
        = statusData?.info?.status || proposal.status || 'closed' // fallback for unknown status

      // Active statuses: pending, active, queued
      if (['pending', 'active', 'queued'].includes(actualStatus)) {
        activeCount++
      }
      // Closed statuses: canceled, defeated, succeeded, expired, executed, closed
      else if (
        [
          'canceled',
          'defeated',
          'succeeded',
          'expired',
          'executed',
          'closed',
        ].includes(actualStatus)
      ) {
        // closedCount++
      }
      // Fallback: treat unknown status as closed
      // else {
      //   closedCount++
      // }
    })

    return { activeCount }
  }

  const { activeCount } = getProposalStats()
  const totalVotes = proposals.reduce(
    (acc: number, p: Proposal) => acc + (p.voteCasts?.length || 0),
    0,
  )

  // react-query v5: prefer derived flag rather than deprecated isInitialLoading
  const showSkeleton = isLoading && !data

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-lg text-red-500">Error loading proposals</div>
          <div className="text-sm text-muted">
            {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* DAO Overview */}
      <section className="space-y-4">
        <h1 className="text-4xl font-bold">
          {config.app.name}
        </h1>
        <p className="text-xl">
          {config.app.description}
        </p>
        {showSkeleton
          ? (
              <StatsSkeleton labels={[t('home.totalProposals'), t('home.activeProposals'), t('home.totalVotes')]} />
            )
          : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-6 border rounded-lg bg-card">
                  <div className="text-2xl font-bold">{proposals.length}</div>
                  <div className="text-sm">{t('home.totalProposals')}</div>
                </div>
                <div className="p-6 border rounded-lg bg-card">
                  <div className={cn('text-2xl font-bold', { ' text-primary': activeCount > 0 })}>{activeCount}</div>
                  <div className="text-sm">{t('home.activeProposals')}</div>
                </div>
                <div className="hidden md:block p-6 border rounded-lg bg-card">
                  <div className="text-2xl font-bold">{totalVotes}</div>
                  <div className="text-sm">{t('home.totalVotes')}</div>
                </div>
              </div>
            )}
      </section>

      {/* Proposals List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {t('home.governanceProposals')}
          </h2>
          <Button
            onClick={() => {
              if (isMember && !isDelegated) {
                setPostDelegateNavigate(ROUTES.CREATE_PROPOSAL)
                setDelegateModalOpen(true)
                return
              }
              navigate(ROUTES.CREATE_PROPOSAL)
            }}
          >
            <FaPlus />
            {' '}
            {t('proposal.create')}
          </Button>
        </div>
        {showSkeleton
          ? (
              <ProposalListSkeleton />
            )
          : proposals.length > 0
            ? (
                <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                  {proposals.map((proposal: Proposal, index: number) => (
                    <ProposalListItem
                      key={proposal.id}
                      proposal={proposal}
                      numericCode={statuses[proposal.id]?.code ?? null}
                      proposalNumber={proposals.length - index}
                    />
                  ))}
                </div>
              )
            : (
                <div className="p-8 w-full border rounded-lg text-center bg-card text-muted">
                  {t('home.noProposals')}
                </div>
              )}
      </section>

      {govParams && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {/* Voting Delay */}
          <div className="p-4 border rounded-md bg-card">
            <div className="text-xs uppercase mb-1">
              {t('governanceParams.votingDelay')}
              <Popover>
                <PopoverTrigger asChild>
                  <span className="ml-1 lowercase text-secondary cursor-pointer select-none">
                    ⓘ
                  </span>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" alignOffset={100}>
                  <p>{t('governanceParams.votingDelayHelp')}</p>
                </PopoverContent>
              </Popover>
            </div>
            <div className="text-lg font-semibold">
              {govParams.votingDelay.toString()}
              {' '}
              blocks
              <span className="ml-2 text-xs font-normal text-secondary">
                {estimateDurationFromBlocks(
                  Number(govParams.votingDelay),
                  getAverageBlockTime(
                    Number.parseInt(config.network.chainId, 16)
                    || Number(config.network.chainId),
                  ),
                )}
              </span>
            </div>
          </div>
          {/* Voting Period */}
          <div className="p-4 border rounded-md bg-card">
            <div className="text-xs uppercase mb-1">
              {t('governanceParams.votingPeriod')}
              <Popover>
                <PopoverTrigger asChild>
                  <span className="ml-1 lowercase text-secondary cursor-pointer select-none">
                    ⓘ
                  </span>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" alignOffset={100}>
                  <p>{t('governanceParams.votingPeriodHelp')}</p>
                </PopoverContent>
              </Popover>
            </div>
            <div className="text-lg font-semibold space-y-1">
              <div>
                {govParams.votingPeriod.toString()}
                {' '}
                blocks
                <span className="ml-2 text-xs font-normal text-secondary">
                  {estimateDurationFromBlocks(
                    Number(govParams.votingPeriod),
                    getAverageBlockTime(
                      Number.parseInt(config.network.chainId, 16)
                      || Number(config.network.chainId),
                    ),
                  )}
                </span>
              </div>
            </div>
          </div>
          {/* Proposal Threshold */}
          <div className="p-4 border rounded-md bg-card">
            <div className="text-xs uppercase mb-1">
              {t('governanceParams.proposalThreshold')}
              <Popover>
                <PopoverTrigger asChild>
                  <span className="ml-1 lowercase text-secondary cursor-pointer select-none">
                    ⓘ
                  </span>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" alignOffset={100}>
                  <p>{t('governanceParams.proposalThresholdHelp')}</p>
                </PopoverContent>
              </Popover>
            </div>
            <div className="text-lg font-semibold">
              {formatTokenAmount(
                BigInt(govParams.proposalThreshold),
                tokenInfo?.decimals || 18,
              )}
            </div>
          </div>
          {/* Quorum Percent */}
          <div className="p-4 border rounded-md bg-card">
            <div className="text-xs uppercase mb-1 flex items-center gap-1">
              {t('governanceParams.quorumPercent')}
              <Popover>
                <PopoverTrigger asChild>
                  <span className="ml-1 lowercase text-secondary cursor-pointer select-none">
                    ⓘ
                  </span>
                </PopoverTrigger>
                <PopoverContent side="top" align="start">
                  <p className="w-48">
                    {t('governanceParams.quorumPercentHelp')}
                  </p>
                </PopoverContent>
              </Popover>
            </div>
            <div className="text-lg font-semibold">
              {(
                (Number(govParams.quorumNum)
                  / Math.max(1, Number(govParams.quorumDen)))
                * 100
              ).toFixed(2)}
              %
            </div>
          </div>
        </div>
      )}

      {/* Token Holders List with Delegate button (only visible when wallet connected) */}
      {wallet && <TokenHoldersList />}
      {delegateModalOpen && (
        <DelegateModal
          open={delegateModalOpen}
          onClose={() => {
            setDelegateModalOpen(false)
            setPostDelegateNavigate(null)
          }}
          onDelegated={() => {
            const target = postDelegateNavigate
            setDelegateModalOpen(false)
            setPostDelegateNavigate(null)
            if (target) {
              navigate(target)
            }
          }}
        />
      )}
    </div>
  )
}
