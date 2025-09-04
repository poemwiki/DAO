import { useQuery } from '@tanstack/react-query'
import { createPublicClient, http } from 'viem'
import { mainnet, polygon, polygonAmoy, sepolia } from 'viem/chains'
import { governorABI } from '@/abis/governorABI'
import { config } from '@/config'

function getChain() {
  const chainId = config.network.chainId.startsWith('0x')
    ? Number.parseInt(config.network.chainId, 16)
    : Number(config.network.chainId)
  return (
    [mainnet, polygon, polygonAmoy, sepolia].find(c => c.id === chainId)
    || mainnet
  )
}

const publicClient = (() => {
  try {
    return createPublicClient({ chain: getChain(), transport: http() })
  }
  catch {
    return null
  }
})()

export function useQuorumNumerator() {
  return useQuery<bigint | undefined>({
    queryKey: ['governorQuorumNumerator', config.contracts.governor],
    enabled: !!config.contracts.governor && !!publicClient,
    queryFn: async () => {
      if (!publicClient) {
        return undefined
      }
      try {
        return (await publicClient.readContract({
          address: config.contracts.governor as `0x${string}`,
          abi: governorABI,
          functionName: 'quorumNumerator',
        })) as bigint
      }
      catch (e) {
        console.warn('quorumNumerator read failed', e)
        return undefined
      }
    },
    staleTime: 60_000,
  })
}
