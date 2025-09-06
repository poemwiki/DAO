import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { fetchBalanceOf } from '@/queries/tokenSupply'
import { formatTokenAmount } from '@/utils/format'
import { useGovernorParams } from './useGovernorParams'
import { useTokenInfo } from './useTokenInfo'

export function useThresholdCheck(
  proposer?: `0x${string}`,
) {
  const { data: tokenInfo } = useTokenInfo()
  const { data: gov } = useGovernorParams()
  const proposalThreshold = gov?.proposalThreshold
  const publicClient = usePublicClient()
  const [balance, setBalance] = useState<string | null>(null)
  const [balanceBig, setBalanceBig] = useState<bigint | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!publicClient || !proposer || proposalThreshold === undefined || !tokenInfo) {
        return
      }
      setLoading(true)
      try {
        const bal = await fetchBalanceOf(proposer)
        if (!cancelled) {
          if (bal !== undefined) {
            setBalance(formatTokenAmount(bal, tokenInfo?.decimals))
            setBalanceBig(bal)
          }
          else {
            setBalance(null)
            setBalanceBig(null)
          }
        }
      }
      finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [publicClient, proposer, proposalThreshold, tokenInfo])

  const formattedThreshold = gov?.proposalThreshold && tokenInfo?.decimals
    ? formatTokenAmount(BigInt(gov.proposalThreshold), tokenInfo.decimals)
    : null
  const meetsThreshold
    = balanceBig !== null && proposalThreshold !== undefined
      ? balanceBig >= proposalThreshold
      : false
  return {
    balance,
    formattedThreshold,
    meetsThreshold,
    loadingBalance: loading,
  }
}
