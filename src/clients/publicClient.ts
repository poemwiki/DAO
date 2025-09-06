// WHY: Single place to construct read-only viem public client to avoid duplication across queries.
import { createPublicClient, http } from 'viem'
import { mainnet, polygon, polygonAmoy, sepolia } from 'viem/chains'
import { config } from '@/config'

export function getNumericChainId(): number {
  return config.network.chainId.startsWith('0x')
    ? Number.parseInt(config.network.chainId, 16)
    : Number(config.network.chainId)
}

export function resolveChain() {
  const id = getNumericChainId()
  return (
    [mainnet, polygon, polygonAmoy, sepolia].find(c => c.id === id) || mainnet
  )
}

export const sharedPublicClient = (() => {
  try {
    return createPublicClient({ chain: resolveChain(), transport: http() })
  }
  catch {
    return null
  }
})()
