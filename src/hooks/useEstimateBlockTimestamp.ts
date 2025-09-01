import { useQuery } from '@tanstack/react-query'
import { createPublicClient, http } from 'viem'
import { mainnet, polygon, polygonAmoy, sepolia } from 'viem/chains'
import { config as appConfig } from '@/config'

// Average block times (rough) in seconds
const AVG_BLOCK_TIME: Record<number, number> = {
  1: 12, // Ethereum mainnet (post-merge ~12s slot)
  11155111: 12, // Sepolia
  137: 2, // Polygon
  80002: 2, // Polygon Amoy
}

function getChain() {
  const chainId = appConfig.network.chainId.startsWith('0x')
    ? parseInt(appConfig.network.chainId, 16)
    : Number(appConfig.network.chainId)
  return [mainnet, polygon, polygonAmoy, sepolia].find(c => c.id === chainId) || mainnet
}

const publicClient = (() => {
  try {
    const chain = getChain()
    return createPublicClient({ chain, transport: http() })
  } catch (_e) {
    return null
  }
})()

async function fetchLatestBlock() {
  if (!publicClient) throw new Error('No public client')
  const block = await publicClient.getBlock({ blockTag: 'latest' })
  return { number: Number(block.number), timestamp: Number(block.timestamp) }
}

export interface EstimatedBlockTimeResult {
  timestamp: number // unix seconds
  isEstimated: boolean
  latest: { number: number; timestamp: number }
}

export function useEstimateBlockTimestamp(blockNumber?: number | null) {
  return useQuery<EstimatedBlockTimeResult | null>({
    queryKey: ['estimateBlockTs', blockNumber, appConfig.network.chainId],
    enabled: !!blockNumber && !!publicClient,
    queryFn: async () => {
      if (!blockNumber || !publicClient) return null
      const latest = await fetchLatestBlock()
      const diff = blockNumber - latest.number
      // If target block <= latest block, fetch exact block for precision
      if (diff <= 0) {
        try {
          const block = await publicClient.getBlock({ blockNumber: BigInt(blockNumber) })
          return {
            timestamp: Number(block.timestamp),
            isEstimated: false,
            latest,
          }
        } catch {
          // fallback to estimation if direct fetch fails
        }
      }
      const avg = AVG_BLOCK_TIME[getChain().id] || 12
      const est = latest.timestamp + diff * avg
      return { timestamp: est, isEstimated: diff > 0, latest }
    },
    staleTime: 15_000,
  })
}
