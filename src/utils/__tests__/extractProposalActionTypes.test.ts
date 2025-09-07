import { describe, expect, it, vi } from 'vitest'
import { extractProposalActionTypes } from '../proposal'

// Mock viem decodeFunctionData similar to parseProposalActions tests
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

describe('extractProposalActionTypes', () => {
  it('decodes mint from calldata', () => {
    const types = extractProposalActionTypes({ calldatas: ['0xaaaamint'], signatures: [] })
    expect(types).toEqual(['mint'])
  })
  it('decodes batchMint from calldata', () => {
    const types = extractProposalActionTypes({ calldatas: ['0xaaaabatch'], signatures: [] })
    expect(types).toEqual(['batchMint'])
  })
  it('decodes governor setting from calldata', () => {
    const types = extractProposalActionTypes({ calldatas: ['0xaaaavdelay'], signatures: [] })
    expect(types).toEqual(['governorSetting'])
  })
  it('falls back to signatures when calldata empty', () => {
    const types = extractProposalActionTypes({ calldatas: ['0x'], signatures: ['mint()'] })
    expect(types).toEqual(['mint'])
  })
  it('returns unknown when neither decode nor signature match', () => {
    const types = extractProposalActionTypes({ calldatas: ['0xdeadbeef'], signatures: [] })
    expect(types).toEqual(['unknown'])
  })
  it('handles multiple mixed entries', () => {
    const types = extractProposalActionTypes({ calldatas: ['0xaaaamint', '0x', '0xaaaavdelay'], signatures: ['mint()', 'batchMint()', 'setVotingDelay(uint256)'] })
    expect(types).toEqual(['mint', 'batchMint', 'governorSetting'])
  })
})
