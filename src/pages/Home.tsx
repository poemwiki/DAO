import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { getProposals, ProposalsResponseData } from '@/graphql'
import { formatRelativeTime } from '@/utils/format'
import { extractBracketCode } from '@/utils/proposal'
import ProposalStatusBadge from '@/components/ProposalStatusBadge'
import { useProposalStates } from '@/hooks/useProposalStates'
import { ROUTES } from '@/constants'
import { config } from '@/config'
import TokenHoldersList from '@/components/TokenHoldersList'
import type { Proposal } from '@/types'
import { Button } from '@/components/ui/button'
import { FaPlus } from "react-icons/fa";
import { useState } from 'react'
import DelegateModal from '@/components/DelegateModal'
import { useIsDelegated } from '@/hooks/useIsDelegated'

export default function Home() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isMember, isDelegated } = useIsDelegated()
  const [delegateModalOpen, setDelegateModalOpen] = useState(false)
  const [postDelegateNavigate, setPostDelegateNavigate] = useState<string | null>(null)
  const { isLoading, error, data } = useQuery<ProposalsResponseData>({
    queryKey: ['proposals'],
    queryFn: getProposals,
  })
  const proposals = data?.proposals || []
  const { statuses } = useProposalStates(proposals)

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 border rounded-lg bg-card">
            <div className="text-2xl font-bold">{proposals.length}</div>
            <div className="text-sm text-muted-foreground">{t('home.totalProposals')}</div>
          </div>
          <div className="p-6 border rounded-lg bg-card">
            <div className="text-2xl font-bold">
              {proposals.filter((p: Proposal) => p.status === 'active').length}
            </div>
            <div className="text-sm text-muted-foreground">{t('home.activeProposals')}</div>
          </div>
          <div className="p-6 border rounded-lg bg-card">
            <div className="text-2xl font-bold">
              {proposals.filter((p: Proposal) => p.status === 'closed').length}
            </div>
            <div className="text-sm text-muted-foreground">{t('home.closedProposals')}</div>
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
        <div className="grid grid-cols-2 gap-4">
          {proposals.map((proposal: Proposal) => {
            const desc = proposal.description || ''
            const code = extractBracketCode(desc)
            const numericCode = statuses[proposal.id]?.code ?? null
            return (
              <Link
                key={proposal.id}
                to={ROUTES.PROPOSAL.replace(':id', proposal.id)}
                className="block p-6 border rounded-lg hover:border-primary transition-colors bg-card"
              >
                <div className="flex flex-col h-full gap-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="text-lg font-semibold truncate">{code}</h3>
                      <p className="text-muted-foreground line-clamp-3 break-words">{desc.replace(/^\[.*?\]\s*/, '')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ProposalStatusBadge proposal={proposal} numericCode={numericCode} />
                    </div>
                  </div>
                  <div className="mt-1 flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{t('home.created')}: {formatRelativeTime(proposal.createdAt, t('lang') as string)}</span>
                    <span>•</span>
                    <span>{t('home.updated')}: {formatRelativeTime(proposal.updatedAt, t('lang') as string)}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Token Holders List with Delegate button */}
      <TokenHoldersList />
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
