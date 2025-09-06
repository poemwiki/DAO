// Centralized token info query utilities to ensure single fetch + shared cache.
// WHY: Lives under queries/ alongside future fetchers & mutations to keep hooks lean.
import type { usePublicClient } from 'wagmi'
import { tokenABI } from '@/abis/tokenABI'
import { config } from '@/config'

export interface TokenInfoResult {
  name: string
  symbol: string
  decimals: number
  address: `0x${string}`
}

export function tokenInfoQueryKey(address?: string | null) {
  return ['tokenInfo', address || config.contracts.token]
}

export async function fetchTokenInfo(
  publicClient: ReturnType<typeof usePublicClient> | null,
  address?: `0x${string}`,
): Promise<TokenInfoResult | undefined> {
  if (!publicClient)
    return undefined
  const target = (address || config.contracts.token) as `0x${string}`
  if (!target)
    return undefined
  const [name, symbol, decimals] = await Promise.all([
    publicClient.readContract({
      address: target,
      abi: tokenABI,
      functionName: 'name',
    }) as Promise<string>,
    publicClient.readContract({
      address: target,
      abi: tokenABI,
      functionName: 'symbol',
    }) as Promise<string>,
    publicClient.readContract({
      address: target,
      abi: tokenABI,
      functionName: 'decimals',
    }) as Promise<number>,
  ])
  return { name, symbol, decimals, address: target }
}
