import type { TokenInfoResult } from '@/queries/tokenInfo'
import { useQuery } from '@tanstack/react-query'
import { usePublicClient } from 'wagmi'
import { config } from '@/config'
import { useTokenInfoCache } from '@/context/TokenInfoContext'
import { fetchTokenInfo, tokenInfoQueryKey } from '@/queries/tokenInfo'

export function useTokenInfo(tokenAddress?: `0x${string}`) {
  const publicClient = usePublicClient()
  const cache = useTokenInfoCache() // optional placeholder for default token
  const address = (tokenAddress || config.contracts.token) as `0x${string}` | undefined
  return useQuery<TokenInfoResult | undefined>({
    queryKey: tokenInfoQueryKey(address),
    enabled: !!publicClient && !!address,
    placeholderData: () => {
      if (!tokenAddress && cache.symbol && cache.decimals !== undefined) {
        return {
          name: cache.name || '',
          symbol: cache.symbol,
          decimals: cache.decimals,
          address: (cache.address || address) as `0x${string}`,
        }
      }
      return undefined
    },
    queryFn: () => fetchTokenInfo(publicClient, address),
    staleTime: 60_000,
  })
}
