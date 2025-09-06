// Shared governor related query builders (quorum, params, quorum numerator, etc.)
// WHY: Consolidates contract read logic to avoid duplicated client creation and query key drift.
// NOTE: Uses sharedPublicClient from clients/publicClient to avoid duplicating construction.
import { governorABI } from '@/abis/governorABI'
import { sharedPublicClient } from '@/clients/publicClient'
import { config } from '@/config'

export const governorAddress = () => config.contracts.governor as `0x${string}`

// Query keys
export const qkGovernorQuorum = (block?: number) => ['governorQuorum', governorAddress(), block]
export const qkGovernorQuorumNumerator = () => ['governorQuorumNumerator', governorAddress()]
export const qkGovernorParams = () => ['governorParams', governorAddress()]

export async function fetchGovernorQuorum(blockNumber: number, client = sharedPublicClient) {
  if (!client || blockNumber === undefined)
    return undefined
  try {
    return (await client.readContract({
      address: governorAddress(),
      abi: governorABI,
      functionName: 'quorum',
      args: [BigInt(blockNumber)],
    })) as bigint
  }
  catch (e) {
    console.warn('quorum read failed', e)
    return undefined
  }
}

export async function fetchGovernorQuorumNumerator(client = sharedPublicClient) {
  const params = await loadGovernorParams(client)
  return params?.quorumNum
}

export interface GovernorParamsResult {
  votingDelay: bigint
  votingPeriod: bigint
  proposalThreshold: bigint
  quorumNum: bigint
  quorumDen: bigint
  token: `0x${string}`
}

export async function fetchGovernorParams(client = sharedPublicClient): Promise<GovernorParamsResult | undefined> {
  return loadGovernorParams(client)
}

// Internal cached loader (simple in-memory TTL cache & promise dedupe)
let governorParamsCache: { value: GovernorParamsResult, expires: number } | null = null
let governorParamsPromise: Promise<GovernorParamsResult | undefined> | null = null
const GOVERNOR_PARAMS_TTL_MS = 300_000 // 5 min

// Functions that, when executed successfully, should invalidate cached params.
// (Function names from Governor that affect these values.)
export const GOVERNOR_PARAM_MUTATING_FUNCTIONS = new Set<`0x${string}` | string>([
  'updateQuorumNumerator',
  'setVotingDelay',
  'setVotingPeriod',
  'updateProposalThreshold',
])

export function invalidateGovernorParamsCache() {
  governorParamsCache = null
  governorParamsPromise = null
}

async function loadGovernorParams(client = sharedPublicClient): Promise<GovernorParamsResult | undefined> {
  if (!client)
    return undefined
  const now = Date.now()
  if (governorParamsCache && governorParamsCache.expires > now) {
    return governorParamsCache.value
  }
  if (governorParamsPromise) {
    return governorParamsPromise
  }
  governorParamsPromise = (async () => {
    try {
      const address = governorAddress()
      const [votingDelay, votingPeriod, proposalThreshold, quorumNum, quorumDen, token] = await Promise.all([
        client.readContract({ address, abi: governorABI, functionName: 'votingDelay' }),
        client.readContract({ address, abi: governorABI, functionName: 'votingPeriod' }),
        client.readContract({ address, abi: governorABI, functionName: 'proposalThreshold' }),
        client.readContract({ address, abi: governorABI, functionName: 'quorumNumerator' }),
        client.readContract({ address, abi: governorABI, functionName: 'quorumDenominator' }),
        client.readContract({ address, abi: governorABI, functionName: 'token' }),
      ])
      const result: GovernorParamsResult = { votingDelay, votingPeriod, proposalThreshold, quorumNum, quorumDen, token }
      governorParamsCache = { value: result, expires: now + GOVERNOR_PARAMS_TTL_MS }
      return result
    }
    catch (e) {
      console.warn('loadGovernorParams failed', e)
      return undefined
    }
    finally {
      governorParamsPromise = null
    }
  })()
  return governorParamsPromise
}
