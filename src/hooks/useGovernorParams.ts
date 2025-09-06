import { useQuery } from '@tanstack/react-query'
import { sharedPublicClient } from '@/clients/publicClient'
import { config } from '@/config'
import { fetchGovernorParams, qkGovernorParams } from '@/queries/governor'

export function useGovernorParams() {
  return useQuery({
    queryKey: qkGovernorParams(),
    enabled: !!config.contracts.governor && !!sharedPublicClient,
    queryFn: () => fetchGovernorParams(),
    staleTime: 300_000, // align with internal governor params TTL
  })
}
