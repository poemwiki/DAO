import React from 'react'
import { PROPOSAL_TYPE } from '@/constants'
import type { ProposalForm } from '@/hooks/useProposalForm'
import { useTokenInfo } from '@/hooks/useTokenInfo'

export interface ExecutionPreviewProps {
  form: ProposalForm
  t: (k: string, opts?: Record<string, unknown>) => string
  proposerAddress?: `0x${string}`
}

// WHY: Isolated from CreateProposal page to keep page component lean (<300 lines) and enable reuse/testing.
export const ExecutionPreview: React.FC<ExecutionPreviewProps> = ({ form, t, proposerAddress }) => {
  const { data: tokenInfo } = useTokenInfo()
  const decimals = tokenInfo?.decimals ?? 18
  const lines: string[] = []
  switch (form.type) {
    case PROPOSAL_TYPE.MINT:
      lines.push(`token.mint(${form.address || '<address>'}, ${form.amount || '0'} * 1e18)`) // display human readable
      break
    case PROPOSAL_TYPE.BUDGET:
      lines.push(`token.mintAndApprove(${form.address || proposerAddress || '<address>'}, ${form.amount || '0'} * 1e18)`) // fallback to connected wallet
      break
    case PROPOSAL_TYPE.BATCH_MINT:
      lines.push('token.batchMint([')
      form.batch.forEach((r, i) => {
        if (r.address || r.amount) {
          lines.push(`  ${i}. ${r.address || '<address>'}, ${r.amount || '0'} * 1e18`)
        }
      })
      lines.push('])')
      break
    case PROPOSAL_TYPE.GOVERNOR_SETTING:
      if (form.governorFunction === 'setProposalThreshold') {
        const v = form.governorValue || '0'
        lines.push(`${form.governorFunction}(${v} * 1e${decimals})`)
      } else {
        lines.push(`${form.governorFunction}(${form.governorValue || '0'})`)
      }
      break
  }
  return (
    <div className="mt-4 p-3 border rounded bg-card">
      <p className="text-xs font-semibold mb-2">{t('proposal.executionPreview', { defaultValue: 'Execution Preview' })}</p>
      <pre className="text-[11px] leading-snug whitespace-pre-wrap break-words font-mono opacity-80">
        {lines.join('\n')}
      </pre>
    </div>
  )
}

export default ExecutionPreview