import { useQuery } from '@tanstack/react-query'
import { sharedPublicClient } from '@/clients/publicClient'
import { config } from '@/config'
import { fetchPastTotalSupply, qkPastTotalSupply } from '@/queries/tokenSupply'

// Reads total supply at a past block via ERC20Votes getPastTotalSupply for debug / quorum explanation
export function usePastTotalSupply(blockNumber?: number) {
  return useQuery<bigint | undefined>({
    queryKey: qkPastTotalSupply(blockNumber),
    enabled: !!config.contracts.token && typeof blockNumber === 'number' && !!sharedPublicClient,
    queryFn: () => blockNumber === undefined ? Promise.resolve(undefined) : fetchPastTotalSupply(blockNumber),
    staleTime: 60_000,
  })
}
