import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProposal, ProposalResponseData } from '@/graphql'
import { useTranslation } from 'react-i18next'
import { formatGraphTimestamp, formatRelativeTime } from '@/utils/format'
import { extractBracketCode } from '@/utils/proposal'
import { useProposalState } from '@/hooks/useProposalState'
import ProposalStatusBadge from '@/components/ProposalStatusBadge'
import { getExplorerTxUrl } from '@/config'
import { ROUTES } from '@/constants'

export default function Proposal() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { isLoading, error, data } = useQuery<ProposalResponseData>({
    queryKey: ['proposal', id],
    queryFn: () => getProposal(id!),
    enabled: !!id,
  })

  // Call on-chain state hook unconditionally to keep hook order stable across renders.
  const { stateCode } = useProposalState({
    proposalId: data?.proposal?.id || id,
    tx: data?.proposal?.proposeTx,
  })

  if (isLoading) return <div>{t('common.loading')}</div>
  if (error) return <div>Error: {error instanceof Error ? error.message : 'Unknown error'}</div>
  if (!data?.proposal) return <div>{t('home.backToProposals')}</div>

  const proposal = data.proposal
  const code = extractBracketCode(proposal.description) || proposal.id.slice(0, 10) + '…'
  const txUrl = getExplorerTxUrl(proposal.proposeTx)
  const shortTx = proposal.proposeTx
    ? proposal.proposeTx.slice(0, 8) + '...' + proposal.proposeTx.slice(-6)
    : ''

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
          {txUrl && (
            <a
              href={txUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline font-mono break-all"
            >
              {shortTx}
            </a>
          )}
        </div>
        <div className="flex items-center flex-wrap gap-3 text-xs text-muted-foreground">
          <ProposalStatusBadge proposal={proposal} numericCode={stateCode ?? null} />
          <span>
            {t('home.created')}: {formatRelativeTime(proposal.createdAt, t('lang') as string)}
          </span>
          <span>•</span>
          <span>
            {t('home.updated')}: {formatRelativeTime(proposal.updatedAt, t('lang') as string)}
          </span>
        </div>
      </header>
      <section className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">{t('proposal.description')}</h2>
          <p className="text-muted-foreground leading-loose whitespace-pre-wrap break-words">
            {proposal.description.replace(/^\[.*?\]\s*/, '')}
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Timeline</h2>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>
              {t('home.created')}: {formatGraphTimestamp(proposal.createdAt, t('lang') as string)} ({formatRelativeTime(proposal.createdAt, t('lang') as string)})
            </div>
            <div>
              {t('home.updated')}: {formatGraphTimestamp(proposal.updatedAt, t('lang') as string)} ({formatRelativeTime(proposal.updatedAt, t('lang') as string)})
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
