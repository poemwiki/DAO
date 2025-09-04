import { useQuery } from '@tanstack/react-query'
import { createPublicClient, http } from 'viem'
import { mainnet, polygon, polygonAmoy, sepolia } from 'viem/chains'
import { tokenABI } from '@/abis/tokenABI'
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

// Reads total supply at a past block via ERC20Votes getPastTotalSupply for debug / quorum explanation
export function usePastTotalSupply(blockNumber?: number) {
  return useQuery<bigint | undefined>({
    queryKey: ['tokenPastTotalSupply', config.contracts.token, blockNumber],
    enabled:
      !!config.contracts.token
      && typeof blockNumber === 'number'
      && !!publicClient,
    queryFn: async () => {
      if (!publicClient || blockNumber === undefined) {
        return undefined
      }
      try {
        return (await publicClient.readContract({
          address: config.contracts.token as `0x${string}`,
          abi: tokenABI,
          functionName: 'getPastTotalSupply',
          args: [BigInt(blockNumber)],
        })) as bigint
      }
      catch (e) {
        console.warn('getPastTotalSupply read failed', e)
        return undefined
      }
    },
    staleTime: 60_000,
  })
}
