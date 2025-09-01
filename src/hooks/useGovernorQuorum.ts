import { useQuery } from '@tanstack/react-query'
import { config } from '@/config'
import { createPublicClient, http } from 'viem'
import { mainnet, polygon, polygonAmoy, sepolia } from 'viem/chains'
import { governorABI } from '@/abis/governorABI'

function getChain() {
  const chainId = config.network.chainId.startsWith('0x')
    ? parseInt(config.network.chainId, 16)
    : Number(config.network.chainId)
  return [mainnet, polygon, polygonAmoy, sepolia].find(c => c.id === chainId) || mainnet
}

const publicClient = (() => {
  try {
    return createPublicClient({ chain: getChain(), transport: http() })
  } catch {
    return null
  }
})()

export function useGovernorQuorum(blockNumber?: number) {
  return useQuery<bigint | undefined>({
    queryKey: ['governorQuorum', config.contracts.governor, blockNumber],
    enabled: !!config.contracts.governor && typeof blockNumber === 'number' && !!publicClient,
    queryFn: async () => {
      if (!publicClient || blockNumber === undefined) return undefined
      try {
        return (await publicClient.readContract({
          address: config.contracts.governor as `0x${string}`,
          abi: governorABI,
          functionName: 'quorum',
          args: [BigInt(blockNumber)],
        })) as bigint
      } catch (e) {
        console.warn('quorum read failed', e)
        return undefined
      }
    },
    staleTime: 60_000,
  })
}
