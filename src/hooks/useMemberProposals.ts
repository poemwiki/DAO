import { useQuery } from '@tanstack/react-query'
import { getMemberProposals } from '@/graphql'
import { memberQueryKeys } from '@/queries/member'

export function useMemberProposals(address: string | undefined) {
  const query = useQuery({
    queryKey: memberQueryKeys.proposals(address || ''),
    enabled: !!address,
    queryFn: async () => {
      if (!address)
        return { proposals: [] }
      const result = await getMemberProposals(address.toLowerCase())
      return result
    },
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  })

  const proposalsCount = query.data?.proposals?.length || 0

  return {
    ...query,
    proposals: query.data?.proposals || [],
    createdProposalsCount: proposalsCount,
  }
}
