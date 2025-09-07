import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { GRAPHQL_PAGE_SIZES } from '@/constants'
import { getMemberVotes } from '@/graphql'
import { memberQueryKeys } from '@/queries/member'

export function useMemberVotes(address: string | undefined, page = 0, pageSize: number = GRAPHQL_PAGE_SIZES.DEFAULT) {
  const query = useQuery({
    queryKey: memberQueryKeys.votes(address || '', page),
    enabled: !!address,
    queryFn: async () => {
      if (!address)
        return { voteCasts: [] }
      return getMemberVotes(address.toLowerCase(), page * pageSize, pageSize)
    },
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  })

  // Calculate vote statistics
  const voteStats = useMemo(() => {
    if (!query.data?.voteCasts) {
      return {
        totalVotes: 0,
        totalWeight: '0',
        uniqueProposals: 0,
        supportBreakdown: { for: 0, against: 0, abstain: 0 },
      }
    }

    const votes = query.data.voteCasts
    const uniqueProposals = new Set(votes.map(v => v.proposal?.id).filter(Boolean)).size
    const totalWeight = votes.reduce((sum, vote) => sum + BigInt(vote.weight), 0n).toString()

    const supportBreakdown = votes.reduce(
      (acc, vote) => {
        if (vote.support === 1)
          acc.for++
        else if (vote.support === 0)
          acc.against++
        else if (vote.support === 2)
          acc.abstain++
        return acc
      },
      { for: 0, against: 0, abstain: 0 },
    )

    return {
      totalVotes: votes.length,
      totalWeight,
      uniqueProposals,
      supportBreakdown,
    }
  }, [query.data])

  return {
    ...query,
    votes: query.data?.voteCasts || [],
    voteStats,
  }
}
