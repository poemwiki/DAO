import type { Proposal, RequiredPick } from '@/types'
import type { GovernorStateCode } from '@/utils/governor'
import type { ParsedAction } from '@/utils/parseProposalActions'
import { decodeFunctionData } from 'viem'
import { combinedABI } from '@/abis'
import i18n from '@/i18n'
import { ACTION_TYPE_MAP } from '@/utils/actionTypes'

// Extended state mapping similar to legacy governor.js
export type DerivedStatus
  = | 'pending'
    | 'active'
    | 'canceled'
    | 'defeated'
    | 'succeeded'
    | 'queued'
    | 'expired'
    | 'executed'
    | 'closed'

export interface StatusInfo {
  status: DerivedStatus
  emoji?: string
  i18nKey: string // proposalStatus.<status>
  detailI18nKey?: string // proposalStatusDetail.<status>
  badgeColor?:
    | 'neutral'
    | 'gray'
    | 'blue'
    | 'green'
    | 'red'
    | 'yellow'
    | 'orange'
    | 'purple'
    | 'slate'
    | 'cyan'
}

// Map numeric codes (if contract/state is later supplied) to statuses
export const NUMERIC_STATUS_MAP: Record<GovernorStateCode, StatusInfo> = {
  0: {
    status: 'pending',
    emoji: '⚪',
    i18nKey: 'proposalStatus.pending',
    detailI18nKey: 'proposalStatusDetail.pending',
    badgeColor: 'gray',
  },
  1: {
    status: 'active',
    emoji: '🔵',
    i18nKey: 'proposalStatus.active',
    detailI18nKey: 'proposalStatusDetail.active',
    badgeColor: 'green',
  },
  2: {
    status: 'canceled',
    emoji: '❌',
    i18nKey: 'proposalStatus.canceled',
    detailI18nKey: 'proposalStatusDetail.canceled',
    badgeColor: 'slate',
  },
  3: {
    status: 'defeated',
    emoji: '🔴',
    i18nKey: 'proposalStatus.defeated',
    detailI18nKey: 'proposalStatusDetail.defeated',
    badgeColor: 'red',
  },
  4: {
    status: 'succeeded',
    emoji: '🟢',
    i18nKey: 'proposalStatus.succeeded',
    detailI18nKey: 'proposalStatusDetail.succeeded',
    badgeColor: 'green',
  },
  5: {
    status: 'queued',
    emoji: '⏸',
    i18nKey: 'proposalStatus.queued',
    detailI18nKey: 'proposalStatusDetail.queued',
    badgeColor: 'yellow',
  },
  6: {
    status: 'expired',
    emoji: '➖',
    i18nKey: 'proposalStatus.expired',
    detailI18nKey: 'proposalStatusDetail.expired',
    badgeColor: 'slate',
  },
  7: {
    status: 'executed',
    emoji: '✅',
    i18nKey: 'proposalStatus.executed',
    detailI18nKey: 'proposalStatusDetail.executed',
    badgeColor: 'green',
  },
}

const NUMERIC_STATUS_MAP_BY_KEY: Record<string, StatusInfo> = Object.values(
  NUMERIC_STATUS_MAP,
).reduce(
  (acc, v) => {
    acc[v.status] = v
    return acc
  },
  {} as Record<string, StatusInfo>,
)

// Heuristic derivation using available fields; if p.status exists and matches, prefer it.
export function deriveProposalStatus(p: Proposal): DerivedStatus {
  if (p.status && p.status in NUMERIC_STATUS_MAP_BY_KEY) {
    return p.status as DerivedStatus
  }
  if (p.canceled) {
    return 'canceled'
  }
  if (p.executed) {
    return 'executed'
  }
  // If executedTx present but executed false, consider queued
  if (!p.executed && p.executeTx) {
    return 'queued'
  }
  // Expired if endBlock passed and not executed/succeeded (approx by time if no block context)
  const nowSec = Date.now() / 1000
  const start = p.startBlock ? Number(p.startBlock) : undefined
  const end = p.endBlock ? Number(p.endBlock) : undefined
  if (start && nowSec < start) {
    return 'pending'
  }
  if (start && end && nowSec >= start && nowSec <= end) {
    return 'active'
  }
  if (end && nowSec > end) {
    // We can't distinguish defeated vs succeeded without vote counts; fallback closed
    return 'closed'
  }
  return 'closed'
}

export function getStatusInfo(p: Proposal): StatusInfo {
  const derived = deriveProposalStatus(p)
  return (
    NUMERIC_STATUS_MAP_BY_KEY[derived] || {
      status: derived,
      emoji: '',
      i18nKey: `proposalStatus.${derived}`,
      detailI18nKey: `proposalStatusDetail.${derived}`,
    }
  )
}

export function extractBracketCode(description?: string): string | undefined {
  if (!description) {
    return undefined
  }
  const match = description.match(/^\s*\[[^\]]+\]/)
  return match ? match[0] : undefined
}

// Consolidated helper used by UI components to get display info (emoji + i18n key)
// Preference order:
// 1. On-chain numeric state (provided via numericCode argument)
// 2. Provided proposal.status if valid
// 3. Heuristic derivation
export function getDisplayStatusInfo(
  p: Proposal,
  numericCode?: GovernorStateCode | null,
): StatusInfo {
  if (typeof numericCode === 'number' && numericCode in NUMERIC_STATUS_MAP) {
    return NUMERIC_STATUS_MAP[numericCode]
  }
  if (p.status && p.status in NUMERIC_STATUS_MAP_BY_KEY) {
    return NUMERIC_STATUS_MAP_BY_KEY[p.status]
  }
  return getStatusInfo(p)
}

// Determine a fallback proposal title when the bracket code is purely numeric.
// Priority order when multiple action types exist:
// batchMint > mintAndApprove > mint > governorSetting > unknown
export type ProposalActionType = ParsedAction['type'] | 'unknown'

export function deriveFallbackProposalTitle(actionTypes: ProposalActionType[]): {
  key: string
  type: ProposalActionType
} {
  let type: ProposalActionType = 'unknown'
  const has = (t: ProposalActionType) => actionTypes.includes(t)
  if (has('batchMint'))
    type = 'batchMint'
  else if (has('mintAndApprove'))
    type = 'mintAndApprove'
  else if (has('mint'))
    type = 'mint'
  else if (has('governorSetting'))
    type = 'governorSetting'
  const map: Record<string, string> = {
    batchMint: 'proposal.fallbackTitle.batchMint',
    mint: 'proposal.fallbackTitle.mint',
    mintAndApprove: 'proposal.fallbackTitle.mintAndApprove',
    governorSetting: 'proposal.fallbackTitle.governorSetting',
    unknown: 'proposal.fallbackTitle.default',
  }
  return { key: map[type] || map.unknown, type }
}

export function extractProposalActionTypes(
  proposal: Required<Pick<Proposal, 'calldatas' | 'signatures'>>,
): ProposalActionType[] {
  const calldatas = proposal.calldatas || []
  const sigs = proposal.signatures || []
  if ((!calldatas || calldatas.length === 0) && (!sigs || sigs.length === 0))
    return []
  const types: ProposalActionType[] = []
  for (let i = 0; i < Math.max(calldatas.length, sigs.length); i++) {
    const data = calldatas[i]
    let fn: string | undefined
    if (data && data !== '0x') {
      try {
        const decoded = decodeFunctionData({ abi: combinedABI, data: data as `0x${string}` })
        fn = decoded.functionName
      }
      catch {
        fn = undefined
      }
    }
    if (!fn && sigs[i]) {
      // signature format e.g. transfer(address,uint256) -> extract name before '('
      const raw = sigs[i]
      fn = raw.split('(')[0]
    }
    if (!fn) {
      types.push('unknown')
      continue
    }
    types.push(ACTION_TYPE_MAP[fn] || 'unknown')
  }
  return types
}

export function getDisplayDescription(description?: string): string {
  return description?.replace(/^\s*#\s+([^\r\n]+)\s*/, '').replace(/^\s*\[.*?\]\s*/, '') || ''
}

/**
 * This keeps a single canonical algorithm for
 * deriving the user-visible title.
 */
export function getProposalTitle(
  proposal: RequiredPick<Proposal, 'calldatas' | 'signatures' | 'description'>,
): string {
  if (!proposal) {
    throw new Error('Proposal is required')
  }

  const description = proposal.description
  const h1Match = description?.match(/^\s*#\s+([^\r\n]+)/)
  if (h1Match)
    return h1Match[1]
  const bracketCode = extractBracketCode(description)
  if (bracketCode) {
    const inner = bracketCode.replace(/^\[/, '').replace(/\]$/, '').trim()
    if (!/^\d+$/.test(inner))
      return bracketCode
  }
  const actionTypes = extractProposalActionTypes(proposal)
  if (bracketCode) {
    const inner = bracketCode.replace(/^\[/, '').replace(/\]$/, '').trim()
    if (/^\d+$/.test(inner)) {
      const fb = deriveFallbackProposalTitle(actionTypes)
      return i18n.t(fb.key)
    }
    return bracketCode
  }
  const fb = deriveFallbackProposalTitle(actionTypes)
  return i18n.t(fb.key)
}
