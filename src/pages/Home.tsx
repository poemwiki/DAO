import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { getProposals, ProposalsResponseData } from '@/graphql'
import { cn, formatRelativeTime } from '@/utils/format'
import { extractBracketCode, buildProposalTitle } from '@/utils/proposal'
import { parseProposalActions } from '@/lib/parseProposalActions'
import { useTokenInfo } from '@/hooks/useTokenInfo'
import ProposalStatusBadge from '@/components/ProposalStatusBadge'
import { useProposalStates } from '@/hooks/useProposalStates'
import { ROUTES } from '@/constants'
import { config } from '@/config'
import TokenHoldersList from '@/components/TokenHoldersList'
import type { Proposal } from '@/types'
import { Button } from '@/components/ui/button'
import { FaPlus } from 'react-icons/fa'
import { useState } from 'react'
import { formatTokenAmount, estimateDurationFromBlocks } from '@/utils/format'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover'
import { getAverageBlockTime } from '@/constants/blockTimes'
import { useGovernorParams } from '@/hooks/useGovernorParams'
import DelegateModal from '@/components/DelegateModal'
import { useIsDelegated } from '@/hooks/useIsDelegated'
import Badge from '@/components/ui/Badge'
import { useConnectWallet } from '@web3-onboard/react'

export default function Home() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isMember, isDelegated } = useIsDelegated()
  const [{ wallet }] = useConnectWallet()
  const [delegateModalOpen, setDelegateModalOpen] = useState(false)
  const [postDelegateNavigate, setPostDelegateNavigate] = useState<string | null>(null)
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
      const actualStatus = statusData?.info?.status || proposal.status || 'closed' // fallback for unknown status

      // Active statuses: pending, active, queued
      if (['pending', 'active', 'queued'].includes(actualStatus)) {
        activeCount++
      }
      // Closed statuses: canceled, defeated, succeeded, expired, executed, closed
      else if (
        ['canceled', 'defeated', 'succeeded', 'expired', 'executed', 'closed'].includes(
          actualStatus
        )
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
    0
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-lg">Loading proposals...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-lg text-red-500">Error loading proposals</div>
          <div className="text-sm text-muted-foreground">
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
        <h1 className="text-4xl font-bold">{config.app.name}</h1>
        <p className="text-xl text-muted-foreground">{config.app.description}</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-6 border rounded-lg bg-card">
            <div className="text-2xl font-bold">{proposals.length}</div>
            <div className="text-sm text-muted-foreground">{t('home.totalProposals')}</div>
          </div>
          <div className="p-6 border rounded-lg bg-card">
            <div className={cn('text-2xl font-bold', { ' text-primary': activeCount > 0 })}>
              {activeCount}
            </div>
            <div className="text-sm text-muted-foreground">{t('home.activeProposals')}</div>
          </div>
          <div className="hidden md:block p-6 border rounded-lg bg-card">
            <div className="text-2xl font-bold">{totalVotes}</div>
            <div className="text-sm text-muted-foreground">{t('home.totalVotes')}</div>
          </div>
        </div>
      </section>

      {/* Proposals List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t('home.governanceProposals')}</h2>
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
            <FaPlus /> {t('proposal.create')}
          </Button>
        </div>
        {proposals.length > 0 ? (
          <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
            {proposals.map((proposal: Proposal, index: number) => {
              const desc = proposal.description || ''
              const bracketCode = extractBracketCode(desc)
              const parsedActions = parseProposalActions(
                proposal.targets || [],
                proposal.calldatas || [],
                proposal.signatures || [],
                tokenInfo?.decimals,
                tokenInfo?.symbol
              )
              const displayTitle = buildProposalTitle(bracketCode, parsedActions, t)
              const numericCode = statuses[proposal.id]?.code ?? null
              const proposalNumber = proposals.length - index
              return (
                <Link
                  key={proposal.id}
                  to={ROUTES.PROPOSAL.replace(':id', proposal.id)}
                  className="block p-4 sm:p-6 border rounded-lg hover:border-primary transition-colors bg-card"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex justify-start items-start md:items-center gap-2 flex-col md:flex-row">
                          <h3 className="text-lg font-semibold break-words flex-1 min-w-0">
                            {displayTitle}
                          </h3>
                          <Badge color="slate" outline={true}>
                            Proposal #{proposalNumber}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground line-clamp-3 break-words text-sm sm:text-base">
                          {desc.replace(/^\[.*?\]\s*/, '')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs">
                      <ProposalStatusBadge proposal={proposal} numericCode={numericCode} />
                      <span>
                        {t('home.created')}:{' '}
                        {formatRelativeTime(proposal.createdAt, t('lang') as string)}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="p-8 w-full border rounded-lg text-center bg-card text-muted-foreground">
            {t('home.noProposals')}
          </div>
        )}
      </section>

      {govParams && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {/* Voting Delay */}
          <div className="p-4 border rounded-md bg-card">
            <div className="text-xs uppercase opacity-60 mb-1">
              {t('governanceParams.votingDelay')}
              <span className="ml-2 text-xs font-normal opacity-70">
                {estimateDurationFromBlocks(
                  Number(govParams.votingPeriod),
                  getAverageBlockTime(
                    parseInt(config.network.chainId, 16) || Number(config.network.chainId)
                  )
                )}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <span className="ml-1 lowercase text-muted-foreground cursor-pointer select-none">
                    ⓘ
                  </span>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" alignOffset={100}>
                  <p>{t('governanceParams.votingDelayHelp')}</p>
                </PopoverContent>
              </Popover>
            </div>
            <div className="text-lg font-semibold">{govParams.votingDelay.toString()} blocks</div>
          </div>
          {/* Voting Period */}
          <div className="p-4 border rounded-md bg-card">
            <div className="text-xs uppercase opacity-60 mb-1">
              {t('governanceParams.votingPeriod')}
              <Popover>
                <PopoverTrigger asChild>
                  <span className="ml-1 lowercase text-muted-foreground cursor-pointer select-none">
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
                {govParams.votingPeriod.toString()} blocks
                <span className="ml-2 text-xs font-normal opacity-70">
                  {estimateDurationFromBlocks(
                    Number(govParams.votingPeriod),
                    getAverageBlockTime(
                      parseInt(config.network.chainId, 16) || Number(config.network.chainId)
                    )
                  )}
                </span>
              </div>
            </div>
          </div>
          {/* Proposal Threshold */}
          <div className="p-4 border rounded-md bg-card">
            <div className="text-xs uppercase opacity-60 mb-1">
              {t('governanceParams.proposalThreshold')}
              <Popover>
                <PopoverTrigger asChild>
                  <span className="ml-1 lowercase text-muted-foreground cursor-pointer select-none">
                    ⓘ
                  </span>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" alignOffset={100}>
                  <p>{t('governanceParams.proposalThresholdHelp')}</p>
                </PopoverContent>
              </Popover>
            </div>
            <div className="text-lg font-semibold">
              {formatTokenAmount(BigInt(govParams.proposalThreshold), 18)}
            </div>
          </div>
          {/* Quorum Percent */}
          <div className="p-4 border rounded-md bg-card">
            <div className="text-xs uppercase opacity-60 mb-1 flex items-center gap-1">
              {t('governanceParams.quorumPercent')}
              <Popover>
                <PopoverTrigger asChild>
                  <span className="ml-1 lowercase text-muted-foreground cursor-pointer select-none">
                    ⓘ
                  </span>
                </PopoverTrigger>
                <PopoverContent side="top" align="start">
                  <p className="w-48">{t('governanceParams.quorumPercentHelp')}</p>
                </PopoverContent>
              </Popover>
            </div>
            <div className="text-lg font-semibold">
              {(
                (Number(govParams.quorumNum) / Math.max(1, Number(govParams.quorumDen))) *
                100
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
            if (target) navigate(target)
          }}
        />
      )}
    </div>
  )
}
