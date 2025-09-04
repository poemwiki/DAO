import type { PublicClient } from 'viem'
import { decodeFunctionResult, encodeFunctionData } from 'viem'
import { governorABI } from '@/abis/governorABI'
import { config } from '@/config'

// Governor state codes (OpenZeppelin Governor) are 0..7
export type GovernorStateCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

function assertGovernorStateCode(n: number): asserts n is GovernorStateCode {
  if (n < 0 || n > 7) {
    throw new Error(`Unexpected governor state code: ${n}`)
  }
}

export function parseProposalId(raw?: string | null): bigint {
  if (!raw) {
    throw new Error('Missing proposalId')
  }
  try {
    return BigInt(raw)
  } catch {
    throw new Error('Invalid proposalId')
  }
}

export async function readGovernorState(
  client: PublicClient | undefined,
  proposalIdRaw: string | null | undefined,
): Promise<GovernorStateCode> {
  if (!client) {
    throw new Error('No public client')
  }
  if (!config.contracts.governor) {
    throw new Error('Governor address not configured')
  }
  const id = parseProposalId(proposalIdRaw)
  const data = encodeFunctionData({
    abi: governorABI,
    functionName: 'state',
    args: [id],
  })
  const callResult = await client.call({
    to: config.contracts.governor as `0x${string}`,
    data,
  })
  if (!callResult.data) {
    throw new Error('Empty call result data for state()')
  }
  const decoded = decodeFunctionResult({
    abi: governorABI,
    functionName: 'state',
    data: callResult.data,
  }) as number
  const num = Number(decoded)
  assertGovernorStateCode(num)
  return num
}
