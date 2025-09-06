// Block-related shared query utilities
import { sharedPublicClient } from '@/clients/publicClient'
import { config } from '@/config'

export const qkLatestBlock = () => ['latestBlock', config.network.chainId]

export interface LatestBlockInfo {
  number: number
  timestamp: number
}

export async function fetchLatestBlockInfo(client = sharedPublicClient): Promise<LatestBlockInfo | undefined> {
  if (!client)
    return undefined
  const block = await client.getBlock({ blockTag: 'latest' })
  return { number: Number(block.number), timestamp: Number(block.timestamp) }
}
