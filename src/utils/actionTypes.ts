import type { ParsedAction } from '@/utils/parseProposalActions'

// Single source of truth mapping function names -> action category
export const ACTION_TYPE_MAP: Record<string, ParsedAction['type']> = {
  setVotingDelay: 'governorSetting',
  setVotingPeriod: 'governorSetting',
  setProposalThreshold: 'governorSetting',
  updateQuorumNumerator: 'governorSetting',
  mint: 'mint',
  batchMint: 'batchMint',
  mintAndApprove: 'mintAndApprove',
}

export type ActionCategory = ParsedAction['type']
