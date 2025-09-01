import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { usePublicClient } from 'wagmi'
import { config } from '@/config'
import { tokenABI } from '@/abis/tokenABI'

export interface TokenInfoCache {
  name?: string
  symbol?: string
  decimals?: number
  address?: `0x${string}`
  loading: boolean
  error?: unknown
  refresh?: () => void
}

const TokenInfoContext = createContext<TokenInfoCache>({ loading: true })

export const TokenInfoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const publicClient = usePublicClient()
  const [state, setState] = useState<TokenInfoCache>({ loading: true })

  const load = useCallback(async () => {
    if (state.loading === false && state.symbol) return
    const address = config.contracts.token as `0x${string}`
    if (!address) {
      console.warn('[TokenInfo] Missing token address in config')
      setState(s => ({ ...s, loading: false }))
      return
    }
    if (!publicClient) {
      // try again shortly
      console.debug('[TokenInfo] publicClient not ready, retrying...')
      setTimeout(load, 500)
      return
    }
    try {
      console.debug('[TokenInfo] fetching token info', { address })
      const code = await publicClient.getBytecode({ address })
      if (!code) {
        console.warn('[TokenInfo] No bytecode at address; using config fallback symbol')
        setState({
          name: '',
          symbol: 'TOKEN',
          // default common decimals
          decimals: 18,
          address,
          loading: false,
          error: new Error('No contract bytecode'),
        })
        return
      }
      const results = await Promise.allSettled([
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

      console.debug('[TokenInfo] fetched token info', results)

      const [nameRes, symbolRes, decimalsRes] = results
      const name = nameRes.status === 'fulfilled' ? nameRes.value : ''
      const symbol = symbolRes.status === 'fulfilled' ? symbolRes.value : 'TOKEN'
      const decimals = decimalsRes.status === 'fulfilled' ? decimalsRes.value : 18
      console.debug('[TokenInfo] loaded', {
        name,
        symbol,
        decimals,
        partialFailures: results.filter(r => r.status === 'rejected').length,
      })
      setState({ name, symbol, decimals, address, loading: false })
    } catch (error) {
      console.error('[TokenInfo] load fatal error', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error,
        // ensure we still expose a symbol for UI
        symbol: prev.symbol || config.network.token || 'TOKEN',
        decimals: prev.decimals || 18,
        address,
      }))
    }
  }, [publicClient, state.loading])

  useEffect(() => {
    load()
  }, [load])

  return (
    <TokenInfoContext.Provider value={{ ...state, refresh: load }}>
      {children}
    </TokenInfoContext.Provider>
  )
}

export function useTokenInfoCache() {
  return useContext(TokenInfoContext)
}
