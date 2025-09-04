import { describe, expect, it, vi } from 'vitest'

import { parseProposalActions } from './parseProposalActions'

// Mock viem's decodeFunctionData to avoid brittle ABI encoding issues in test env.
vi.mock('viem', async () => {
  const actual = (await vi.importActual<unknown>('viem')) as Record<
    string,
    unknown
  >
  return {
    ...actual,
    decodeFunctionData: ({ data }: { data: `0x${string}` }) => {
      switch (data) {
        case '0xaaaamint':
          return {
            functionName: 'mint',
            args: [
              '0x000000000000000000000000000000000000dEaD',
              10n * 10n ** 18n,
            ],
          }
        case '0xaaaamintapprove':
          return {
            functionName: 'mintAndApprove',
            args: [
              '0x000000000000000000000000000000000000bEEF',
              3n * 10n ** 18n,
            ],
          }
        case '0xaaaabatch':
          return {
            functionName: 'batchMint',
            args: [
              [
                '0x000000000000000000000000000000000000dEaD',
                '0x000000000000000000000000000000000000bEEF',
              ],
              [5n * 10n ** 18n, 7n * 10n ** 18n],
            ],
          }
        case '0xaaaavdelay':
          return { functionName: 'setVotingDelay', args: [1234n] }
        default:
          throw new Error(`Unknown test calldata: ${data}`)
      }
    },
  }
})

const mintCalldata: `0x${string}` = '0xaaaamint'
const mintAndApproveCalldata: `0x${string}` = '0xaaaamintapprove'
const batchMintCalldata: `0x${string}` = '0xaaaabatch'
const setVotingDelayCalldata: `0x${string}` = '0xaaaavdelay'

describe('parseProposalActions', () => {
  it('parses mint action', () => {
    const data = mintCalldata
    const actions = parseProposalActions(
      ['0x0000000000000000000000000000000000000001'],
      [data],
      undefined,
      18,
      'PWR',
    )
    expect(actions[0].type).toBe('mint')
  })
  it('parses batchMint action with recipients', () => {
    const data = batchMintCalldata
    const actions = parseProposalActions(
      ['0x0000000000000000000000000000000000000001'],
      [data],
      undefined,
      18,
      'PWR',
    )
    expect(actions[0].type).toBe('batchMint')
    expect(actions[0].recipients?.length).toBe(2)
  })
  it('parses mintAndApprove action', () => {
    const data = mintAndApproveCalldata
    const actions = parseProposalActions(
      ['0x0000000000000000000000000000000000000001'],
      [data],
      undefined,
      18,
      'PWR',
    )
    expect(actions[0].type).toBe('mintAndApprove')
  })
  it('parses governor setting (setVotingDelay)', () => {
    const data = setVotingDelayCalldata
    const actions = parseProposalActions(
      ['0x0000000000000000000000000000000000000002'],
      [data],
      undefined,
      18,
      'PWR',
    )
    expect(actions[0].type).toBe('governorSetting')
  })
})
