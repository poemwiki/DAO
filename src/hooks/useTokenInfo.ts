import { useQuery } from '@tanstack/react-query'
import { usePublicClient } from 'wagmi'
import { tokenABI } from '@/abis/tokenABI'
import { config } from '@/config'
import { useTokenInfoCache } from '@/context/TokenInfoContext'

export interface TokenInfoResult {
  name: string
  symbol: string
  decimals: number
  address: `0x${string}`
}

export function useTokenInfo(tokenAddress?: `0x${string}`) {
  const publicClient = usePublicClient()
  const cache = useTokenInfoCache()
  // If default token requested and cache ready, just return cache via stable query
  const target = tokenAddress || config.contracts.token
  return useQuery<TokenInfoResult | undefined>({
    queryKey: ['tokenInfo', target],
    enabled: !!publicClient && !!target,
    placeholderData: () => {
      if (!tokenAddress && cache.symbol && cache.decimals !== undefined) {
        return {
          name: cache.name || '',
          symbol: cache.symbol,
          decimals: cache.decimals,
          address: (cache.address || target) as `0x${string}`,
        }
      }
      return undefined
    },
    queryFn: async () => {
      if (!publicClient) {
        return undefined
      }
      // If asking for default token and cache loaded, skip network
      if (!tokenAddress && cache.symbol && cache.decimals !== undefined) {
        return {
          name: cache.name || '',
          symbol: cache.symbol,
          decimals: cache.decimals,
          address: (cache.address || target) as `0x${string}`,
        }
      }
      const address = target as `0x${string}`
      const [name, symbol, decimals] = await Promise.all([
        publicClient.readContract({
          address,
          abi: tokenABI,
          functionName: 'name',
        }) as Promise<string>,
        publicClient.readContract({
          address,
          abi: tokenABI,
          functionName: 'symbol',
        }) as Promise<string>,
        publicClient.readContract({
          address,
          abi: tokenABI,
          functionName: 'decimals',
        }) as Promise<number>,
      ])
      return { name, symbol, decimals, address }
    },
  })
}
