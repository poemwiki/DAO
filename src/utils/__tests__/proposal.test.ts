import type { Proposal } from '@/types'
import { describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { deriveFallbackProposalTitle, deriveProposalStatus, extractProposalActionTypes, getProposalTitle } from '../proposal'

// Mock viem decodeFunctionData similar to existing action tests
vi.mock('viem', async () => {
  const actual = (await vi.importActual<unknown>('viem')) as Record<string, unknown>
  return {
    ...actual,
    decodeFunctionData: ({ data }: { data: `0x${string}` }) => {
      switch (data) {
        case '0xaaaamint':
          return { functionName: 'mint', args: [] }
        case '0xaaaabatch':
          return { functionName: 'batchMint', args: [] }
        case '0xaaaavdelay':
          return { functionName: 'setVotingDelay', args: [1234n] }
        default:
          throw new Error('unknown calldata')
      }
    },
  }
})

function baseProposal(): Proposal {
  return {
    id: '1',
    description: '# Title\nBody',
    createdAt: '0',
    updatedAt: '0',
    // Required arrays on Proposal type (empty by default in tests)
    calldatas: [],
    signatures: [],
  }
}

describe('deriveProposalStatus', () => {
  it('prefers explicit status', () => {
    const p: Proposal = { ...baseProposal(), status: 'executed', executed: true }
    expect(deriveProposalStatus(p)).toBe('executed')
  })
  it('detects canceled', () => {
    const p: Proposal = { ...baseProposal(), canceled: true }
    expect(deriveProposalStatus(p)).toBe('canceled')
  })
})

describe('extractProposalActionTypes', () => {
  it('decodes from calldatas', () => {
    const types = extractProposalActionTypes({ calldatas: ['0xaaaamint'], signatures: [] })
    expect(types).toEqual(['mint'])
  })
  it('falls back to signatures', () => {
    const types = extractProposalActionTypes({ calldatas: ['0x'], signatures: ['batchMint()'] })
    expect(types).toEqual(['batchMint'])
  })
})

describe('deriveFallbackProposalTitle', () => {
  it('prioritizes batchMint over others', () => {
    const fb = deriveFallbackProposalTitle(['mint', 'batchMint'])
    expect(fb.type).toBe('batchMint')
  })
})

describe('getProposalTitle', () => {
  it('extracts H1', () => {
    const p: Proposal = { ...baseProposal(), description: '# MainTitle\nSomething' }
    expect(getProposalTitle(p)).toBe('MainTitle')
  })
  it('returns bracket code when non-numeric', () => {
    const p: Proposal = { ...baseProposal(), description: '[ABC] rest' }
    expect(getProposalTitle(p)).toBe('[ABC]')
  })
  it('uses fallback when numeric bracket and actions', () => {
    const p: Proposal = { ...baseProposal(), description: '[123] something', calldatas: ['0xaaaamint'], signatures: [] }
    expect(getProposalTitle(p)).toMatch(i18n.t('proposal.fallbackTitle.mint'))
  })
})
