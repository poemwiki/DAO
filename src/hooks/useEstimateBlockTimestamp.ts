import { useQuery } from '@tanstack/react-query'
import { sharedPublicClient } from '@/clients/publicClient'
import { config as appConfig } from '@/config'
import { getAverageBlockTime } from '@/constants/blockTimes'
import { fetchLatestBlockInfo, qkLatestBlock } from '@/queries/block'

export interface EstimatedBlockTimeResult {
  timestamp: number // unix seconds
  isEstimated: boolean
  latest: { number: number, timestamp: number }
}

// exact: whether to fetch precise past block timestamp via RPC when block <= latest
// default true for backward compatibility; pass false in high-volume lists to reduce RPC calls.
export function useEstimateBlockTimestamp(blockNumber?: number | null, options?: { exact?: boolean }) {
  const exact = options?.exact !== false // default true
  // First query: latest block (shared)
  const latestQuery = useQuery({
    queryKey: qkLatestBlock(),
    enabled: !!sharedPublicClient,
    queryFn: () => fetchLatestBlockInfo(),
    staleTime: 15_000,
  })

  return useQuery<EstimatedBlockTimeResult | null>({
    queryKey: ['estimateBlockTs', blockNumber, appConfig.network.chainId],
    enabled: !!blockNumber && !!latestQuery.data && !!sharedPublicClient,
    queryFn: async () => {
      if (!blockNumber || !latestQuery.data) {
        return null
      }
      const latest = latestQuery.data
      const diff = blockNumber - latest.number
      if (exact && diff <= 0 && sharedPublicClient) {
        // Only fetch historical block if needed for exact timestamp (past or current)
        try {
          const past = await sharedPublicClient.getBlock({ blockNumber: BigInt(blockNumber) })
          return { timestamp: Number(past.timestamp), isEstimated: false, latest }
        }
        catch {
          // fall back to estimation if fails
        }
      }
      const avg = getAverageBlockTime(
        Number(
          appConfig.network.chainId.startsWith('0x')
            ? Number.parseInt(appConfig.network.chainId, 16)
            : appConfig.network.chainId,
        ),
      )
      const est = latest.timestamp + diff * avg
      return { timestamp: est, isEstimated: diff > 0 || !exact, latest }
    },
    staleTime: 15_000,
  })
}
