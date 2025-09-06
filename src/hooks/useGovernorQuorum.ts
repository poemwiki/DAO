import { useQuery } from '@tanstack/react-query'
import { sharedPublicClient } from '@/clients/publicClient'
import { config } from '@/config'
import { fetchGovernorQuorum, qkGovernorQuorum } from '@/queries/governor'

export function useGovernorQuorum(blockNumber?: number) {
  return useQuery<bigint | undefined>({
    queryKey: qkGovernorQuorum(blockNumber),
    enabled: !!config.contracts.governor && typeof blockNumber === 'number' && !!sharedPublicClient,
    queryFn: () => blockNumber === undefined ? Promise.resolve(undefined) : fetchGovernorQuorum(blockNumber),
    staleTime: 60_000,
  })
}
