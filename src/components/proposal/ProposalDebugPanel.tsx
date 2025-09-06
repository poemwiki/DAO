import { useGovernorQuorum } from '@/hooks/useGovernorQuorum'
import { usePastTotalSupply } from '@/hooks/usePastTotalSupply'
import { useQuorumNumerator } from '@/hooks/useQuorumNumerator'
import type { Proposal } from '@/types'

export interface ProposalDebugPanelProps {
  proposal: Proposal
  stateCode: number | null
}

// WHY: Internalize quorum + supply reads; caller only passes proposal + stateCode.
export function ProposalDebugPanel({
  proposal,
  stateCode,
}: ProposalDebugPanelProps) {
  if (!proposal) {
    return null
  }
  const snapshotBlock = proposal?.startBlock
    ? Number(proposal.startBlock)
    : undefined
  const { data: quorumRaw } = useGovernorQuorum(snapshotBlock)
  const { data: pastTotalSupply } = usePastTotalSupply(snapshotBlock)
  const { data: quorumNumerator } = useQuorumNumerator()
  return (
    <section className="space-y-2 p-4 border rounded-md bg-card text-xs font-mono break-all">
      <div className="font-semibold">Debug</div>
      <div>startBlock(raw): {proposal.startBlock}</div>
      <div>endBlock(raw): {proposal.endBlock}</div>
      <div>
        difference(end-start):{' '}
        {proposal.endBlock && proposal.startBlock
          ? (BigInt(proposal.endBlock) - BigInt(proposal.startBlock)).toString()
          : '-'}
      </div>
      <div>createdAt(raw): {proposal.createdAt}</div>
      <div>Subgraph URL: {import.meta.env.VITE_SUBGRAPH_URL || 'N/A'}</div>
      <div>State code (chain): {stateCode ?? 'null'}</div>
      <div>snapshotBlock (voting start): {snapshotBlock}</div>
      <div>
        pastTotalSupply(snapshotBlock):{' '}
        {pastTotalSupply ? pastTotalSupply.toString() : '-'}
      </div>
      <div>
        quorum(raw at snapshot): {quorumRaw ? quorumRaw.toString() : '-'}
      </div>
      <div>
        quorumNumerator():{' '}
        {quorumNumerator !== undefined ? quorumNumerator.toString() : '-'}
      </div>
    </section>
  )
}
