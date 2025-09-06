import React, { createContext, useContext } from 'react'
import { usePublicClient } from 'wagmi'
import { config } from '@/config'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { fetchTokenInfo, tokenInfoQueryKey, type TokenInfoResult } from '@/queries/tokenInfo'

export interface TokenInfoCache extends Partial<TokenInfoResult> {
  loading: boolean
  error?: unknown
  refresh?: () => void
}

const TokenInfoContext = createContext<TokenInfoCache>({ loading: true })

export const TokenInfoProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()
  const address = config.contracts.token as `0x${string}` | undefined
  const query = useQuery({
    queryKey: tokenInfoQueryKey(address),
    enabled: !!publicClient && !!address,
    queryFn: () => fetchTokenInfo(publicClient, address),
    staleTime: 60_000,
  })
  const value: TokenInfoCache = {
    name: query.data?.name,
    symbol: query.data?.symbol,
    decimals: query.data?.decimals,
    address: query.data?.address,
    loading: query.isLoading,
    error: query.error,
    refresh: () => queryClient.invalidateQueries({ queryKey: tokenInfoQueryKey(address) }),
  }
  return <TokenInfoContext.Provider value={value}>{children}</TokenInfoContext.Provider>
}

export function useTokenInfoCache() {
  return useContext(TokenInfoContext)
}
