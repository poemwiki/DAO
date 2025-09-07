import type { PublicClient } from 'viem'
import { describe, expect, it } from 'vitest'
import { config } from '@/config'
import { GovernorConfigError, parseProposalId, readGovernorState } from '../governor'

// Minimal mock PublicClient implementing readContract we need.
function makeMockClient(returnValue: number): PublicClient {
  return {
    // @ts-expect-error partial mock for unit test; only readContract used
    readContract: async () => returnValue,
  }
}

describe('governor utils', () => {
  it('parseProposalId valid', () => {
    expect(parseProposalId('0x1')).toBe(0x1n)
  })

  it('readGovernorState basic path', async () => {
    if (!config.contracts.governor) {
      // simulate configured address for test
      config.contracts.governor = '0x0000000000000000000000000000000000000001'
    }
    const client = makeMockClient(3)
    const res = await readGovernorState(client, 5n)
    expect(res).toBe(3)
  })

  it('throws when governor address missing', async () => {
    // save & clear
    const prev = config.contracts.governor
    config.contracts.governor = ''
    const client = makeMockClient(0)
    await expect(readGovernorState(client, 1n)).rejects.toBeInstanceOf(GovernorConfigError)
    // restore
    config.contracts.governor = prev
  })
})
