import type { PublicClient } from 'viem'
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
  }
  catch {
    throw new Error('Invalid proposalId')
  }
}

// WHY: Provide narrower surface & simpler call path (viem readContract) to reduce
// boilerplate & potential decoding mistakes. Dedicated error classes enable
// upstream classification (config vs param vs onchain). Simplicity aligns with
// Linus "勿增实体"; minimal data path aligns with Carmack principles.

export class GovernorConfigError extends Error {}
export class InvalidProposalIdError extends Error {}
export class GovernorCallError extends Error {}

export async function readGovernorState(
  client: PublicClient,
  proposalId: bigint,
): Promise<GovernorStateCode> {
  if (!config.contracts.governor) {
    throw new GovernorConfigError('Governor address not configured')
  }
  try {
    const num = (await client.readContract({
      address: config.contracts.governor as `0x${string}`,
      abi: governorABI,
      functionName: 'state',
      args: [proposalId],
    })) as number
    const value = Number(num)
    assertGovernorStateCode(value)
    return value
  }
  catch (e) {
    throw new GovernorCallError((e as Error).message)
  }
}

export function safeParseProposalId(raw?: string | null): bigint {
  try {
    return parseProposalId(raw)
  }
  catch {
    throw new InvalidProposalIdError('Invalid proposalId')
  }
}
