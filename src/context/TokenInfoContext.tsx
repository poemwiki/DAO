import type { TokenInfoResult } from '@/queries/tokenInfo'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import React, { createContext, useContext } from 'react'
import { usePublicClient } from 'wagmi'
import { config } from '@/config'
import { fetchTokenInfo, tokenInfoQueryKey } from '@/queries/tokenInfo'

export interface TokenInfoCache extends Partial<TokenInfoResult> {
  loading: boolean
  error?: unknown
  refresh?: () => void
}

const TokenInfoContext = createContext<TokenInfoCache>({ loading: true })

export const TokenInfoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()
  const address = config.contracts.token as `0x${string}` | undefined

  const query = useQuery({
    queryKey: tokenInfoQueryKey(address),
    enabled: !!publicClient && !!address,
    queryFn: () => fetchTokenInfo(publicClient, address),
    staleTime: 60_000,
  })

  const refresh = React.useCallback(() => {
    if (!address)
      return
    queryClient.invalidateQueries({ queryKey: tokenInfoQueryKey(address) })
  }, [queryClient, address])

  const value = React.useMemo<TokenInfoCache>(() => ({
    name: query.data?.name,
    symbol: query.data?.symbol,
    decimals: query.data?.decimals,
    address: query.data?.address,
    loading: query.isLoading,
    error: query.error,
    refresh,
  }), [
    query.data?.name,
    query.data?.symbol,
    query.data?.decimals,
    query.data?.address,
    query.isLoading,
    query.error,
    refresh,
  ])

  return (
    <TokenInfoContext.Provider value={value}>
      {children}
    </TokenInfoContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTokenInfoCache() {
  return useContext(TokenInfoContext)
}
