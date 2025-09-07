import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { GRAPHQL_PAGE_SIZES } from '@/constants'
import { getMemberVotes } from '@/graphql'
import { memberQueryKeys } from '@/queries/member'

// WHY: Provide paginated (infinite) loading of member votes while keeping
// stats aggregated across loaded pages. Avoids fetching entire history up front.

export function useMemberVotesPages(address: string | undefined, pageSize: number = GRAPHQL_PAGE_SIZES.DEFAULT) {
  const query = useInfiniteQuery({
    queryKey: [...memberQueryKeys.votes(address || ''), { pageSize }],
    enabled: !!address,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!address)
        return { voteCasts: [], page: pageParam as number, reachedEnd: true }
      const data = await getMemberVotes(address.toLowerCase(), (pageParam as number) * pageSize, pageSize)
      const reachedEnd = data.voteCasts.length < pageSize
      return { ...data, page: pageParam as number, reachedEnd }
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.reachedEnd)
        return undefined
      return (lastPage.page as number) + 1
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })

  const allVotes = useMemo(() => {
    return (query.data?.pages || []).flatMap(p => p.voteCasts)
  }, [query.data])

  const voteStats = useMemo(() => {
    if (!allVotes.length) {
      return {
        totalVotes: 0,
        totalWeight: '0',
        uniqueProposals: 0,
        supportBreakdown: { for: 0, against: 0, abstain: 0 },
      }
    }
    const uniqueProposals = new Set(allVotes.map(v => v.proposal?.id).filter(Boolean)).size
    const totalWeight = allVotes.reduce((sum, v) => sum + BigInt(v.weight), 0n).toString()
    const supportBreakdown = allVotes.reduce(
      (acc, v) => {
        if (v.support === 1)
          acc.for++
        else if (v.support === 0)
          acc.against++
        else if (v.support === 2)
          acc.abstain++
        return acc
      },
      { for: 0, against: 0, abstain: 0 },
    )
    return { totalVotes: allVotes.length, totalWeight, uniqueProposals, supportBreakdown }
  }, [allVotes])

  return {
    votes: allVotes,
    voteStats,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    pages: query.data?.pages || [],
    error: query.error as Error | null,
  }
}
