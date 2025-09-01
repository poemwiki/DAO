import { describe, it, expect } from 'vitest'
import { parseProposalActions } from './parseProposalActions'
import { encodeFunctionData } from 'viem'
import { governorABI } from '@/abis/governorABI'

// Minimal fragments needed for tests (mint, batchMint)
const testTokenAbi = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'batchMint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'toArray', type: 'address[]', internalType: 'address[]' },
      { name: 'amountArray', type: 'uint256[]', internalType: 'uint256[]' },
    ],
    outputs: [],
  },
] as const

describe('parseProposalActions', () => {
  it('parses mint action', () => {
    const data = encodeFunctionData({
      abi: testTokenAbi,
      functionName: 'mint',
      args: ['0x000000000000000000000000000000000000dEaD', 10n * 10n ** 18n],
    })
    const actions = parseProposalActions(
      ['0x0000000000000000000000000000000000000001'],
      [data],
      undefined,
      18,
      'PWR'
    )
    expect(actions[0].type).toBe('mint')
  })
  it('parses batchMint action with recipients', () => {
    const recipients = [
      '0x000000000000000000000000000000000000dEaD',
      '0x000000000000000000000000000000000000bEEF',
    ]
    const amounts = [5n * 10n ** 18n, 7n * 10n ** 18n]
    const data = encodeFunctionData({
      abi: testTokenAbi,
      functionName: 'batchMint',
      args: [recipients as readonly `0x${string}`[], amounts as readonly bigint[]],
    })
    const actions = parseProposalActions(
      ['0x0000000000000000000000000000000000000001'],
      [data],
      undefined,
      18,
      'PWR'
    )
    expect(actions[0].type).toBe('batchMint')
    expect(actions[0].recipients?.length).toBe(2)
    expect(actions[0].recipients?.[0].address).toBe(recipients[0])
    expect(actions[0].recipients?.[1].amount).toBe(amounts[1])
  })
  it('parses governor setting (setVotingDelay)', () => {
    const data = encodeFunctionData({
      abi: governorABI as unknown as typeof governorABI,
      functionName: 'setVotingDelay',
      args: [1234n],
    })
    const actions = parseProposalActions(
      ['0x0000000000000000000000000000000000000002'],
      [data],
      undefined,
      18,
      'PWR'
    )
    expect(actions[0].type).toBe('governorSetting')
    expect(actions[0].rawValue?.toString()).toBe('1234')
    expect(actions[0].summary).toContain('投票延迟')
  })
})
